# 宏观经济数据自动更新配置指南

本方案使用 **GitHub Actions + AkShare(开源数据接口)** 实现数据自动定时更新，零服务器成本，完全免费。

---

## 工作原理

```
GitHub Actions (定时触发)
    ↓
Python + AkShare (爬取国家统计局等数据)
    ↓
生成 macro_data.json → public/data/
    ↓
npm run build (构建前端)
    ↓
GitHub Pages (自动部署)
```

**定时频率**：每天凌晨自动更新（北京时间8点 = UTC 00:00）

**数据源**：国家统计局、中国人民银行、财政部等官方渠道（通过AkShare聚合）

---

## 第一步：推送代码到 GitHub

### 1. 创建 GitHub 仓库

访问 https://github.com/new 创建一个新仓库，例如命名为 `macro-economy-dashboard`

### 2. 推送代码

```bash
# 进入项目目录
cd /mnt/agents/output/app

# 初始化git仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "init: 宏观经济数据仪表盘"

# 关联远程仓库（将 yourname 替换为你的GitHub用户名）
git remote add origin https://github.com/yourname/macro-economy-dashboard.git

# 推送
git branch -M main
git push -u origin main
```

---

## 第二步：启用 GitHub Pages

### 1. 进入仓库设置

打开仓库页面 → 点击 **Settings** → 左侧 **Pages**

### 2. 配置部署源

| 设置项 | 值 |
|--------|------|
| Source | **GitHub Actions** |

选择 "GitHub Actions" 作为部署源（不要选Branch）

### 3. 配置Actions权限

Settings → Actions → General → Workflow permissions

选择 **Read and write permissions**

---

## 第三步：验证自动更新

### 手动触发测试

进入仓库 → Actions → "定时更新宏观经济数据" → **Run workflow**

等待约3-5分钟，工作流会依次执行：
1. 安装Python依赖
2. 爬取最新数据
3. 构建前端
4. 部署到GitHub Pages

### 查看部署结果

工作流完成后，访问：
```
https://yourname.github.io/macro-economy-dashboard
```

---

## 第四步：自定义配置

### 修改定时频率

编辑 `.github/workflows/auto-update-data.yml`：

```yaml
on:
  schedule:
    # 格式: 分 时 日 月 周
    # 每天早上8点 (UTC 00:00)
    - cron: '0 0 * * *'
    
    # 可选：每周一早上8点
    # - cron: '0 0 * * 1'
    
    # 可选：每小时
    # - cron: '0 * * * *'
```

### 添加更多数据指标

编辑 `scripts/fetch_macro_data.py`，添加新的爬取函数：

```python
def fetch_new_indicator():
    try:
        df = ak.macro_china_xxx()  # 替换为AkShare的接口
        return {
            'months': df['月份'].tolist(),
            'values': df['指标值'].tolist(),
        }
    except Exception as e:
        print(f"新指标获取失败: {e}")
    return None
```

然后在 `fetch_all_data()` 中调用：

```python
new_data = fetch_new_indicator()
if new_data:
    all_data['newIndicator'] = new_data
```

### AkShare 可用接口列表

完整接口文档：https://akshare.akfamily.xyz/

常用宏观数据接口：

| 接口名 | 说明 |
|--------|------|
| `ak.macro_china_cpi()` | CPI居民消费价格指数 |
| `ak.macro_china_ppi()` | PPI工业生产者出厂价格 |
| `ak.macro_china_pmi()` | PMI采购经理指数 |
| `ak.macro_china_gdp()` | GDP国内生产总值 |
| `ak.macro_china_lpr()` | LPR贷款市场报价利率 |
| `ak.macro_china_shibor()` | SHIBOR上海银行间同业拆放利率 |
| `ak.macro_china_fx_reserves()` | 国家外汇储备 |
| `ak.macro_china_money_supply()` | 货币供应量 |
| `ak.macro_china_retail_sales()` | 社会消费品零售总额 |
| `ak.macro_china_industrial_production()` | 规模以上工业增加值 |
| `ak.macro_china_urban_unemployment()` | 城镇调查失业率 |
| `ak.macro_china_new_house_price()` | 新建商品住宅价格指数 |
| `ak.macro_china_cpx()` | 产成品库存 |
| `ak.macro_china_gdzctz()` | 固定资产投资 |
| `ak.macro_china_hgjck()` | 海关进出口 |
| `ak.macro_china_social_financing()` | 社会融资规模 |
| `ak.macro_china_consumer_goods_retail()` | 限额以上企业商品零售总额 |
| `ak.macro_china_cpi_monthly()` | CPI月度数据 |
| `ak.macro_china_ppi_yearly()` | PPI年度数据 |
| `ak.macro_china_m2_yearly()` | M2货币供应年率 |

---

## 第五步：数据更新状态监控

### 查看最后更新时间

网站部署后，可以通过浏览器控制台查看：

```javascript
fetch('/data/macro_data.json').then(r => r.json()).then(d => console.log('数据更新时间:', d.fetchTime))
```

或者在页面上显示数据 freshness 状态（可在前端代码中添加）。

### Actions运行通知

可以配置GitHub Actions的通知：

1. 仓库 Settings → Notifications
2. 勾选 "Send notifications for failed workflows only"（仅在失败时通知）
3. 绑定邮箱或Slack Webhook

---

## 常见问题

### Q1: AkShare数据是否免费？
**A:** 是的，AkShare是完全免费的开源项目，数据源来自国家统计局、央行等官方公开的网页数据。

### Q2: 数据更新延迟多久？
**A:** 取决于官方发布节奏：
- CPI/PPI：每月11日左右发布上月数据
- PMI：每月月底发布当月数据
- GDP：每季度发布
- 脚本每天运行，有新数据会自动更新

### Q3: 如果AkShare某个接口失效怎么办？
**A:** 脚本会自动捕获异常并使用内置的模拟数据作为fallback，不会影响网站正常运行。可以在脚本中添加多个备用数据源。

### Q4: 能否部署到自己的服务器？
**A:** 可以。将 `.github/workflows/auto-update-data.yml` 中的部署步骤替换为服务器部署命令（如scp/rsync），或者使用webhook触发服务器构建。

### Q5: GitHub Actions有免费额度限制吗？
**A:** 免费账户每月有2000分钟Actions运行时间，本工作流每次约3-5分钟，每天一次完全够用。

---

## 数据流架构图

```
┌─────────────────────────────────────────────────────────────┐
│                       GitHub Actions                         │
│                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ cron定时  │───→│ Python脚本    │───→│  npm run build   │   │
│  │ 每天8点   │    │ + AkShare     │    │  (Vite构建)      │   │
│  └──────────┘    │ 爬取统计局数据 │    └──────────────────┘   │
│                  └──────────────┘              │              │
│                                               ↓              │
│                                        ┌──────────────┐      │
│                                        │ dist/目录    │      │
│                                        │ 包含静态文件 │      │
│                                        └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ GitHub Pages │
                    │ 静态托管      │
                    │ 全球CDN       │
                    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  用户浏览器   │
                    │ React +      │
                    │ ECharts      │
                    └──────────────┘
```

---

## 相关链接

- **AkShare文档**：https://akshare.akfamily.xyz/
- **国家统计局**：https://data.stats.gov.cn/
- **GitHub Actions文档**：https://docs.github.com/actions
- **GitHub Pages文档**：https://docs.github.com/pages
