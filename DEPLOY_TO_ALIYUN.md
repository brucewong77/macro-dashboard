# 阿里云 OSS 静态网站部署指南

## 方案概述

将项目构建产物 (`dist` 目录) 部署到 **阿里云 OSS 对象存储**，并绑定您的自定义域名。这是托管纯静态网站最经济、最稳定的方式。

> 预估费用：每月约 **0~5 元**（按量付费，流量极低时可能免费）

---

## 前置条件

- [x] 阿里云账号
- [x] 已备案的域名
- [x] 本项目已构建（`npm run build` 生成 `dist` 目录）

---

## 第一步：开通 OSS 并创建存储桶

1. 登录 [阿里云控制台](https://www.aliyun.com/)
2. 搜索并进入 **对象存储 OSS**
3. 点击「创建 Bucket」：

| 配置项 | 建议值 | 说明 |
|--------|--------|------|
| Bucket 名称 | `macro-dashboard-www` | 全局唯一，建议用项目名 |
| 地域 | 选择离您最近的（如华东1-杭州） | 影响访问延迟 |
| 存储类型 | 标准存储 | 默认即可 |
| 读写权限 | **公共读** | 必须设为公共读，否则网站无法访问 |
| 服务端加密 | 关闭 | 静态网站无需加密 |

4. 点击「确定」创建

---

## 第二步：开启静态网站托管

1. 进入刚创建的 Bucket → 左侧菜单「基础设置」→「静态页面」
2. 点击「设置」：
   - **默认首页**：`index.html`
   - **默认 404 页**：`index.html`（SPA 应用需要，确保路由刷新正常）
3. 保存

---

## 第三步：绑定自定义域名

1. Bucket 左侧菜单「传输管理」→「域名管理」→「绑定域名」
2. 输入您的域名，例如：
   - `www.yourdomain.com`（使用子域名）
   - `yourdomain.com`（使用根域名）
3. 阿里云会自动生成一个 **OSS 外网访问域名**（如 `macro-dashboard-www.oss-cn-hangzhou.aliyuncs.com`）
4. 按照提示，到您的 **域名解析**（阿里云 DNS/云解析）中添加 CNAME 记录：

| 记录类型 | 主机记录 | 记录值 |
|----------|----------|--------|
| CNAME | `www` | `macro-dashboard-www.oss-cn-hangzhou.aliyuncs.com` |

> ⚠️ 注意：根域名（如 `yourdomain.com`）无法直接 CNAME，建议使用 `www` 子域名，或通过阿里云 ESA/全站加速处理根域名。

---

## 第四步：配置 HTTPS（强烈推荐）

### 方式 A：使用阿里云 CDN（推荐，有免费 HTTPS 证书）

1. 在「域名管理」中，点击已绑定域名后的「开启 CDN 加速」
2. 进入 CDN 控制台 → 选择该域名 → HTTPS 配置
3. 开启 HTTPS → 选择「阿里云免费证书」→ 自动申请并部署
4. 等待 5-10 分钟生效

### 方式 B：仅使用 OSS HTTPS（付费证书）

1. Bucket → 「传输管理」→「域名管理」
2. 上传您的 SSL 证书或购买阿里云证书

---

## 第五步：上传网站文件

### 方式 A：使用 OSS 控制台（首次）

1. 进入 Bucket → 「文件管理」
2. 点击「上传文件」→ 选择 `dist` 目录下的所有文件
3. 确保 `index.html` 在根目录

### 方式 B：使用 ossutil 命令行（推荐，后续更新）

```bash
# 1. 下载并安装 ossutil
# macOS:
curl -o ossutilmac64 https://gosspublic.alicdn.com/ossutil/1.7.19/ossutilmac64
chmod 755 ossutilmac64
sudo mv ossutilmac64 /usr/local/bin/ossutil

# 2. 配置阿里云密钥
ossutil config -i <您的AccessKeyID> -k <您的AccessKeySecret> -e oss-cn-hangzhou.aliyuncs.com

# 3. 上传 dist 目录
ossutil cp -rf dist/ oss://macro-dashboard-www/

# 4. 设置 index.html 的 Content-Type（防止下载而非打开）
ossutil set-meta oss://macro-dashboard-www/index.html Content-Type:text/html -u
```

---

## 第六步：验证部署

1. 等待域名解析生效（通常几分钟）
2. 访问 `https://www.yourdomain.com`
3. 应看到登录页面，输入 `admin` / `macro2024` 登录

---

## 后续更新（重新部署）

代码修改后，只需重新构建并上传：

```bash
cd macro-dashboard
npm run build
ossutil cp -rf dist/ oss://macro-dashboard-www/
```

---

## 常见问题

### Q1: 访问域名显示下载文件而非网页？
确保 `index.html` 的 Content-Type 是 `text/html`。OSS 有时会自动识别错误。

### Q2: 刷新页面后 404？
确保在 OSS 静态页面设置中，将 404 页也设为 `index.html`（SPA 路由需要）。

### Q3: 如何查看访问日志？
开启 OSS 日志功能，或接入阿里云 CDN 后在 CDN 控制台查看日志。

### Q4: 如何配置防盗链？
Bucket → 「权限控制」→「防盗链」，设置 Referer 白名单（填您的域名）。
