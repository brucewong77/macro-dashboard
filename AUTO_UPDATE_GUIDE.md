# 宏观经济数据看板 — 自动更新配置指南

## 项目架构

```
GitHub Actions (每天 09:30 UTC+8 自动触发)
        │
        ▼
Python + AkShare (爬取统计局/央行数据)
        │
        ▼
GitHub Pages (自动部署静态网站)
        │
        ▼
用户浏览器 (React + ECharts 动态加载)
```

---

## 一、创建 GitHub 仓库

### 1.1 在 GitHub 新建仓库
1. 访问 [github.com/new](https://github.com/new)
2. 仓库名称填写：`macro-dashboard`（可自定义）
3. 可见性选择 **Public**（GitHub Pages 免费版需要 Public）
4. 不要勾选 "Initialize this repository with a README"
5. 点击 **Create repository**

### 1.2 推送代码到仓库

在本地项目根目录执行：

```bash
cd macro-dashboard
git init
git add .
git commit -m "init: macro dashboard with auto update"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/macro-dashboard.git
git push -u origin main
```

> 将 `YOUR_USERNAME` 替换为你的 GitHub 用户名

---

## 二、配置 GitHub Pages

### 2.1 启用 Pages 服务
1. 进入仓库页面 → 点击 **Settings**
2. 左侧菜单选择 **Pages**
3. **Source** 选择 **GitHub Actions**
4. 保存

### 2.2 配置 Actions 权限
1. Settings → **Actions** → **General**
2. 找到 **Workflow permissions**
3. 选择 **Read and write permissions**
4. 勾选 **Allow GitHub Actions to create and approve pull requests**（可选）
5. 点击 **Save**

> ⚠️ 这是关键步骤！如果没有写权限，GitHub Actions 无法提交更新后的数据文件。

---

## 三、验证自动更新

### 3.1 手动触发首次运行
1. 进入仓库 → **Actions** 标签页
2. 点击左侧 **Auto Update Macro Data**
3. 点击右侧 **Run workflow** → **Run workflow**
4. 等待工作流执行完成（约 2-3 分钟）

### 3.2 检查运行结果
- **fetch-data** 任务：应显示成功抓取了多个指标数据
- **build-and-deploy** 任务：应显示成功部署到 Pages

### 3.3 访问网站
1. Settings → Pages 中查看分配的域名
2. 通常为：`https://YOUR_USERNAME.github.io/macro-dashboard/`
3. 打开网站，确认数据已正确显示

---

## 四、定时更新说明

### 4.1 默认调度
- **频率**：每天一次
- **时间**：北京时间 09:30（UTC 01:30）
- **配置位置**：`.github/workflows/auto-update-data.yml` 中的 `cron: '30 1 * * *'`

### 4.2 修改定时时间
如需改为其他时间，编辑 cron 表达式：

```yaml
on:
  schedule:
    # 北京时间 08:00 -> UTC 00:00
    - cron: '0 0 * * *'
```

> 注意：GitHub Actions 的 cron 使用 UTC 时间，北京时间 = UTC + 8 小时

### 4.3 手动触发
任何时候都可以进入 Actions 页面手动点击 **Run workflow** 触发更新。

---

## 五、数据回退机制

前端 `src/data/api.ts` 实现了双重保障：

1. **优先远程加载**：页面打开时，尝试从当前域名 `/data/macro_data.json` 获取最新数据（带时间戳防止缓存）
2. **自动回退本地**：如果远程请求失败（网络问题或文件不存在），自动使用打包时内置的 `macro_data.json` 作为回退数据

这样即使某天数据抓取失败，网站依然能正常显示最后一次成功的数据。

---

## 六、本地开发

### 6.1 安装依赖
```bash
cd macro-dashboard
npm install
```

### 6.2 本地预览
```bash
npm run dev
```

### 6.3 手动运行爬虫
```bash
# 需要先安装 Python 依赖
pip install -r scripts/requirements.txt

# 运行爬虫
python scripts/fetch_macro_data.py

# 检查生成的数据
cat public/data/macro_data.json
```

### 6.4 本地构建
```bash
npm run build
```

---

## 七、常见问题

### Q1: GitHub Actions 显示 "Error: Process completed with exit code 1"
- 检查 Python 依赖是否安装成功
- 查看详细日志，可能是某个 AkShare 接口暂时不可用（通常会自动恢复）
- 脚本设计为：只要有一个指标成功就不会中断，全部失败才会报错

### Q2: 页面显示 "数据加载失败"
- 确认 GitHub Pages 已正确部署
- 检查浏览器控制台是否有 CORS 或 404 错误
- 确认 `public/data/macro_data.json` 文件已提交到仓库

### Q3: 数据没有每天自动更新
- 检查 Actions 是否被禁用：Settings → Actions → General
- 检查仓库是否有 60 天无活动（GitHub 会暂停 Actions）
- 检查 cron 时间是否正确（UTC 时间）

### Q4: 如何添加新的指标？
1. 在 `scripts/fetch_macro_data.py` 中添加新的 fetch 函数
2. 在 `indicators` 字典中添加对应键名
3. 在 `src/components/Dashboard.tsx` 中添加到展示列表
4. 重新部署即可

---

## 八、文件说明

| 文件 | 作用 |
|------|------|
| `scripts/fetch_macro_data.py` | Python 数据爬取脚本，使用 AkShare 从国家统计局、央行等获取数据 |
| `scripts/requirements.txt` | Python 依赖列表 |
| `.github/workflows/auto-update-data.yml` | GitHub Actions 工作流，每天定时执行数据抓取和部署 |
| `src/data/api.ts` | 前端 API 层，优先加载远程数据，失败自动回退到本地数据 |
| `src/components/Dashboard.tsx` | 主看板组件，包含数据展示、图表、日历、预警 |
| `public/data/macro_data.json` | 数据存储文件（初始为模拟数据，Actions 运行后会被覆盖为真实数据） |
| `AUTO_UPDATE_GUIDE.md` | 本配置指南 |

---

## 九、数据来源

- **国家统计局**：CPI、PPI、PMI、GDP、社零、固投、失业率、工业利润等
- **中国人民银行**：M2、社融、LPR 等
- **国家外汇管理局**：外汇储备、汇率等
- **海关总署**：进出口数据等

> 所有数据通过 [AkShare](https://www.akshare.xyz/) 开源金融数据接口库获取，数据权威可靠。

---

**部署完成后，您的宏观经济数据看板将实现全自动更新，无需人工干预！** 🎉
