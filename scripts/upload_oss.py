#!/usr/bin/env python3
"""上传 dist/ 目录到阿里云 OSS"""
import os
import sys
import oss2

# ─── 配置 ──────────────────────────────
ENDPOINT = 'https://oss-cn-hangzhou.aliyuncs.com'
BUCKET_NAME = 'bigsmaller-com'

# 从环境变量读取凭据（安全方式）
ACCESS_KEY_ID = os.environ.get('ALI_ACCESS_KEY_ID')
ACCESS_KEY_SECRET = os.environ.get('ALI_ACCESS_KEY_SECRET')

if not ACCESS_KEY_ID or not ACCESS_KEY_SECRET:
    print("❌ 请设置环境变量:")
    print("   export ALI_ACCESS_KEY_ID='你的AccessKeyID'")
    print("   export ALI_ACCESS_KEY_SECRET='你的AccessKeySecret'")
    sys.exit(1)

# 本地 dist 目录
LOCAL_DIR = os.path.join(os.path.dirname(__file__), '..', 'dist')

# ─── 内容类型映射 ─────────────────────
CONTENT_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
}

def get_content_type(filename):
    ext = os.path.splitext(filename)[1].lower()
    return CONTENT_TYPES.get(ext, 'application/octet-stream')

def main():
    auth = oss2.Auth(ACCESS_KEY_ID, ACCESS_KEY_SECRET)
    bucket = oss2.Bucket(auth, ENDPOINT, BUCKET_NAME)

    uploaded = 0
    errors = []

    for root, dirs, files in os.walk(LOCAL_DIR):
        for fname in files:
            if fname in ('.DS_Store', '.nojekyll'):
                continue
            local_path = os.path.join(root, fname)
            remote_path = os.path.relpath(local_path, LOCAL_DIR)

            headers = {'Content-Type': get_content_type(fname)}
            try:
                result = bucket.put_object_from_file(
                    remote_path, local_path, headers=headers
                )
                if result.status == 200:
                    uploaded += 1
                    print(f'  ✅ {remote_path}')
                else:
                    errors.append(f'{remote_path}: HTTP {result.status}')
            except Exception as e:
                errors.append(f'{remote_path}: {e}')
                print(f'  ❌ {remote_path}: {e}')

    print(f'\n📊 上传完成: {uploaded} 个文件')
    if errors:
        print(f'⚠️ 失败 {len(errors)} 个:')
        for e in errors:
            print(f'    {e}')
    else:
        print('✅ 全部上传成功！')
        print(f'🔗 访问: https://bigsmaller-com.oss-cn-hangzhou.aliyuncs.com/index.html')


if __name__ == '__main__':
    main()
