#!/usr/bin/env python3
"""
阿里云 OSS 自动部署脚本
自动完成：创建 Bucket → 配置静态网站 → 上传文件 → 输出域名解析信息
"""

import os
import sys
import mimetypes

# 添加项目根目录到路径
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(PROJECT_DIR, "dist")

def check_dist():
    """检查 dist 目录是否存在"""
    if not os.path.exists(DIST_DIR):
        print(f"❌ 错误：找不到构建目录 {DIST_DIR}")
        print("请先运行：npm run build")
        sys.exit(1)
    print(f"✅ 构建目录存在：{DIST_DIR}")

def get_user_input():
    """获取用户配置（支持环境变量）"""
    print("\n" + "=" * 50)
    print("阿里云 OSS 自动部署配置")
    print("=" * 50)
    
    # 优先从环境变量读取
    access_key_id = os.environ.get("ALI_ACCESS_KEY_ID", "").strip()
    access_key_secret = os.environ.get("ALI_ACCESS_KEY_SECRET", "").strip()
    endpoint = os.environ.get("ALI_ENDPOINT", "").strip()
    domain = os.environ.get("ALI_DOMAIN", "").strip()
    bucket_name = os.environ.get("ALI_BUCKET_NAME", "").strip()
    
    if not access_key_id:
        print("\n📋 请提供以下信息（来自阿里云控制台）：")
        print("   AccessKey 获取方式：阿里云控制台 → 右上角头像 → AccessKey 管理")
        access_key_id = input("\n🔑 AccessKey ID: ").strip()
    if not access_key_secret:
        access_key_secret = input("🔑 AccessKey Secret: ").strip()
    
    if not endpoint:
        print("\n📍 地域选择：")
        regions = {
            "1": ("oss-cn-hangzhou", "华东1（杭州）"),
            "2": ("oss-cn-shanghai", "华东2（上海）"),
            "3": ("oss-cn-beijing", "华北2（北京）"),
            "4": ("oss-cn-shenzhen", "华南1（深圳）"),
            "5": ("oss-cn-qingdao", "华北1（青岛）"),
            "6": ("oss-cn-hongkong", "香港"),
        }
        for k, (code, name) in regions.items():
            print(f"   {k}. {name} ({code}.aliyuncs.com)")
        
        region_choice = input("请选择地域编号 [1]: ").strip() or "1"
        region = regions.get(region_choice, regions["1"])
        endpoint = f"{region[0]}.aliyuncs.com"
    else:
        # 如果传入的是纯地域代码，补全 .aliyuncs.com
        if not endpoint.endswith(".aliyuncs.com"):
            endpoint = f"{endpoint}.aliyuncs.com"
    
    if not domain:
        print(f"\n🌐 您的域名（例如 www.bigsmaller.com）:")
        domain = input("域名: ").strip()
    
    if not bucket_name:
        print(f"\n📦 Bucket 名称（全局唯一，建议：{domain.replace('.', '-')}）:")
        bucket_default = domain.replace(".", "-").replace("www-", "")
        bucket_name = input(f"Bucket 名称 [{bucket_default}]: ").strip() or bucket_default
    
    return {
        "access_key_id": access_key_id,
        "access_key_secret": access_key_secret,
        "endpoint": endpoint,
        "bucket_name": bucket_name,
        "domain": domain,
    }

def create_bucket(auth, endpoint, bucket_name):
    """创建 Bucket 并配置"""
    import oss2
    
    print(f"\n📦 正在创建 Bucket: {bucket_name}")
    
    try:
        # 创建 Bucket（标准存储，公共读）
        bucket = oss2.Bucket(auth, endpoint, bucket_name)
        bucket.create_bucket(oss2.BUCKET_ACL_PUBLIC_READ, oss2.models.BucketCreateConfig(oss2.BUCKET_STORAGE_CLASS_STANDARD))
        print(f"✅ Bucket 创建成功（权限：公共读）")
    except oss2.exceptions.ServerError as e:
        err_code = e.details.get('Code', '') if hasattr(e, 'details') else ''
        if err_code == 'BucketAlreadyExists':
            print(f"⚠️  Bucket 名称已被占用，请更换一个")
            sys.exit(1)
        elif err_code == 'BucketAlreadyOwnedByYou':
            print(f"✅ Bucket 已存在，跳过创建")
            bucket = oss2.Bucket(auth, endpoint, bucket_name)
        elif err_code == 'UserDisable':
            print(f"❌ 账号被禁用或 AccessKey 无效")
            print(f"   可能原因：")
            print(f"   1. AccessKey 已被禁用或删除")
            print(f"   2. 阿里云账号欠费")
            print(f"   3. 没有开通 OSS 服务")
            print(f"   4. 使用了 RAM 子账号但没有 OSS 权限")
            print(f"\n   请登录阿里云控制台检查：")
            print(f"   https://www.aliyun.com/")
            sys.exit(1)
        else:
            raise
    
    return bucket

def configure_static_website(bucket):
    """配置静态网站托管"""
    print("\n🔧 正在配置静态网站托管...")
    
    from oss2.models import BucketWebsite
    
    # 设置默认首页和 404 页（SPA 应用需要将 404 指向 index.html）
    bucket.put_bucket_website(BucketWebsite("index.html", "index.html"))
    print("✅ 静态网站配置完成（首页: index.html, 404页: index.html）")

def upload_files(bucket, dist_dir):
    """上传 dist 目录文件"""
    print(f"\n☁️  正在上传文件到 OSS...")
    
    total = 0
    for root, dirs, files in os.walk(dist_dir):
        for filename in files:
            local_path = os.path.join(root, filename)
            relative_path = os.path.relpath(local_path, dist_dir)
            
            # 猜测 Content-Type
            content_type, _ = mimetypes.guess_type(local_path)
            if content_type is None:
                content_type = "application/octet-stream"
            
            # 上传文件
            headers = {"Content-Type": content_type}
            bucket.put_object_from_file(relative_path.replace("\\", "/"), local_path, headers=headers)
            total += 1
            
            # 特别处理 index.html，确保 Content-Type 正确
            if filename == "index.html":
                bucket.put_object(relative_path.replace("\\", "/"), open(local_path, "rb"), headers={"Content-Type": "text/html"})
    
    print(f"✅ 上传完成，共 {total} 个文件")

def print_summary(config, bucket):
    """输出配置摘要"""
    print("\n" + "=" * 60)
    print("🎉 阿里云 OSS 部署完成！")
    print("=" * 60)
    
    print(f"""
📋 部署信息：
   Bucket: {config['bucket_name']}
   地域: {config['endpoint']}
   域名: {config['domain']}

🌐 访问地址：
   OSS 默认域名: http://{config['bucket_name']}.{config['endpoint']}
   
   （绑定自定义域名后请使用）: https://{config['domain']}

🔐 登录信息：
   用户名: admin
   密码: macro2024

⚠️  【重要】您还需要手动完成最后一步：域名解析
""")
    
    print("=" * 60)
    print("📍 域名解析配置步骤：")
    print("=" * 60)
    print(f"""
1. 登录阿里云控制台 → 域名 → 找到您的域名
2. 点击「解析」→「添加记录」
3. 填写以下信息：

   记录类型: CNAME
   主机记录: www    （如果您用 www.xxx.com）
            @      （如果您用根域名 xxx.com）
   记录值:   {config['bucket_name']}.{config['endpoint']}
   TTL:      默认 10 分钟

4. 保存后等待 5-10 分钟生效
""")
    
    print("=" * 60)
    print("🔒 HTTPS 配置（强烈推荐）：")
    print("=" * 60)
    print("""
1. 阿里云控制台 → 对象存储 OSS → 您的 Bucket
2. 左侧「传输管理」→「域名管理」
3. 找到已绑定的域名 → 点击「开启 CDN 加速」
4. 进入 CDN 控制台 → HTTPS 配置 → 开启 HTTPS
5. 选择「阿里云免费证书」→ 自动申请部署
""")
    
    print("=" * 60)
    print("📝 后续更新代码时，只需运行：")
    print(f"   cd {os.path.basename(PROJECT_DIR)}")
    print("   npm run build")
    print(f"   python3 scripts/auto-deploy-oss.py")
    print("=" * 60)

def main():
    try:
        import oss2
    except ImportError:
        print("正在安装阿里云 OSS SDK...")
        os.system("pip3 install oss2")
        import oss2
    
    print("🚀 宏观经济数据看板 - 阿里云 OSS 自动部署")
    print("本脚本将自动完成：创建 Bucket → 配置静态网站 → 上传文件")
    
    # 检查 dist
    check_dist()
    
    # 获取配置
    config = get_user_input()
    
    # 创建认证对象
    auth = oss2.Auth(config["access_key_id"], config["access_key_secret"])
    
    # 创建并配置 Bucket
    bucket = create_bucket(auth, config["endpoint"], config["bucket_name"])
    configure_static_website(bucket)
    
    # 上传文件
    upload_files(bucket, DIST_DIR)
    
    # 输出摘要
    print_summary(config, bucket)
    
    print("\n✨ 部署完成！请按上方提示完成域名解析配置。")

if __name__ == "__main__":
    main()
