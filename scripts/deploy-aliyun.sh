#!/bin/bash
set -e

# 阿里云 OSS 一键部署脚本
# 用法: ./scripts/deploy-aliyun.sh

# ==================== 配置区域 ====================
# 您可以在此直接填写配置，避免每次输入
BUCKET_NAME=""
ENDPOINT=""
ACCESS_KEY_ID=""
ACCESS_KEY_SECRET=""
# =================================================

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$PROJECT_DIR/dist"

echo "🚀 宏观经济数据看板 - 阿里云 OSS 部署脚本"
echo "=========================================="

# 检查 ossutil
check_ossutil() {
  if ! command -v ossutil &> /dev/null; then
    echo "⚠️ 未检测到 ossutil，正在安装..."
    OS=$(uname -s)
    if [ "$OS" = "Darwin" ]; then
      curl -fsSL -o /tmp/ossutilmac64 https://gosspublic.alicdn.com/ossutil/1.7.19/ossutilmac64
      chmod 755 /tmp/ossutilmac64
      sudo mv /tmp/ossutilmac64 /usr/local/bin/ossutil
    else
      curl -fsSL -o /tmp/ossutil64 https://gosspublic.alicdn.com/ossutil/1.7.19/ossutil64
      chmod 755 /tmp/ossutil64
      sudo mv /tmp/ossutil64 /usr/local/bin/ossutil
    fi
    echo "✅ ossutil 安装完成"
  else
    echo "✅ ossutil 已安装"
  fi
}

# 交互式输入配置
prompt_config() {
  if [ -z "$BUCKET_NAME" ]; then
    read -p "请输入 OSS Bucket 名称: " BUCKET_NAME
  fi
  if [ -z "$ENDPOINT" ]; then
    echo "常用 Endpoint:"
    echo "  华东1(杭州): oss-cn-hangzhou.aliyuncs.com"
    echo "  华东2(上海): oss-cn-shanghai.aliyuncs.com"
    echo "  华北2(北京): oss-cn-beijing.aliyuncs.com"
    echo "  华南1(深圳): oss-cn-shenzhen.aliyuncs.com"
    read -p "请输入 Endpoint: " ENDPOINT
  fi
  if [ -z "$ACCESS_KEY_ID" ]; then
    read -p "请输入 AccessKey ID: " ACCESS_KEY_ID
  fi
  if [ -z "$ACCESS_KEY_SECRET" ]; then
    read -s -p "请输入 AccessKey Secret: " ACCESS_KEY_SECRET
    echo
  fi
}

# 配置 ossutil
configure_ossutil() {
  echo "🔧 正在配置 ossutil..."
  ossutil config -i "$ACCESS_KEY_ID" -k "$ACCESS_KEY_SECRET" -e "$ENDPOINT" --language CH
}

# 构建项目
build_project() {
  echo "📦 正在构建项目..."
  cd "$PROJECT_DIR"
  npm run build
  if [ ! -d "$DIST_DIR" ]; then
    echo "❌ 构建失败，dist 目录不存在"
    exit 1
  fi
  echo "✅ 构建完成"
}

# 上传到 OSS
upload_to_oss() {
  echo "☁️  正在上传到 OSS (oss://$BUCKET_NAME)..."
  ossutil rm -rf "oss://$BUCKET_NAME/" --include "*.html" --include "*.js" --include "*.css" --include "*.svg" --include "*.json" --include "*.png" --include "*.jpg" --include "*.jpeg" --include "*.gif" --include "*.woff" --include "*.woff2" --include "*.ttf" --include "*.eot" 2>/dev/null || true
  ossutil cp -rf "$DIST_DIR/" "oss://$BUCKET_NAME/"
  echo "✅ 上传完成"
}

# 设置 index.html 的 Content-Type
fix_content_type() {
  echo "🔧 正在修正 Content-Type..."
  ossutil set-meta "oss://$BUCKET_NAME/index.html" Content-Type:text/html -u --update
}

# 主流程
main() {
  check_ossutil
  prompt_config
  configure_ossutil
  build_project
  upload_to_oss
  fix_content_type

  echo ""
  echo "=========================================="
  echo "🎉 部署成功！"
  echo "=========================================="
  echo "Bucket: oss://$BUCKET_NAME"
  echo "Endpoint: $ENDPOINT"
  echo ""
  echo "访问地址:"
  echo "  OSS 默认域名: http://$BUCKET_NAME.$ENDPOINT"
  echo "  （绑定自定义域名后请使用您的域名访问）"
  echo ""
  echo "默认登录账号:"
  echo "  用户名: admin"
  echo "  密码: macro2024"
  echo "=========================================="
}

main "$@"
