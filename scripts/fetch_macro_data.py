#!/usr/bin/env python3
"""
宏观经济数据爬取脚本
数据源优先使用 akshare（免费公开数据），失败时回退到 mock 数据。
替换原有的 Wind MCP CLI 方案（CI 环境不可用）。
"""
from __future__ import annotations

import json
import os
import sys
import traceback
from datetime import datetime

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─── 工具函数 ─────────────────────────────────────────

def safe_float(v):
    """安全转换为 float，失败返回 None"""
    if v is None:
        return None
    try:
        f = float(v)
        if str(f) in ('nan', 'inf', '-inf'):
            return None
        return round(f, 1)
    except (ValueError, TypeError):
        return None


def normalize_month(raw: str) -> str | None:
    """将各种日期格式统一为 YYYY-MM"""
    if not raw:
        return None
    raw = str(raw).strip()
    # 2026-06
    if len(raw) == 7 and raw[4] == '-':
        return raw
    # 2026-06-15
    if len(raw) >= 7 and raw[4] == '-':
        return raw[:7]
    # 202606
    if len(raw) == 6 and raw.isdigit():
        return f"{raw[:4]}-{raw[4:6]}"
    # 2026年06月
    import re
    m = re.match(r'(\d{4})\D+(\d{1,2})\D*', raw)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}"
    # 2026年6月份
    return None


def generate_mock_months(start_year=2010, end_year=2026, end_month=6):
    """生成 mock 月份列表 2010-01 ~ 2026-06"""
    months = []
    for y in range(start_year, end_year + 1):
        em = end_month if y == end_year else 12
        sm = 1 if y > start_year else 1
        for m in range(sm, em + 1):
            months.append(f"{y}-{m:02d}")
    return months


# ─── 指标抓取函数 ─────────────────────────────────────

def safe_call(func, **kwargs):
    """带超时和异常保护的调用"""
    try:
        return func(**kwargs)
    except Exception as e:
        print(f"    ⚠️ {func.__name__} 失败: {e}")
        traceback.print_exc()
        return None


def fetch_cpi():
    """CPI 居民消费价格指数（同比 + 环比）"""
    import akshare as ak
    df = ak.macro_china_cpi()
    # 列: 年份, 月份, 当月同比(%), 当月环比(%)
    # 也可能是: 时间, 全国-当月同比, 全国-当月环比 等
    print(f"    CPI columns: {list(df.columns)}")

    # 尝试多种列名
    date_col = None
    yoy_col = None
    mom_col = None

    for c in df.columns:
        cs = str(c).strip()
        if cs in ('月份', '时间', '日期', 'date', 'month'):
            date_col = c
        elif '同比' in cs and ('全国' in cs or '当月' in cs):
            yoy_col = c
        elif '环比' in cs and ('全国' in cs or '当月' in cs):
            mom_col = c

    if not date_col:
        # 尝试第一列为日期
        date_col = df.columns[0]
    if not yoy_col:
        # 尝试含有同比的列
        for c in df.columns:
            if '同比' in str(c):
                yoy_col = c
                break
    if not mom_col:
        for c in df.columns:
            if '环比' in str(c):
                mom_col = c
                break

    if yoy_col is None:
        print(f"    ⚠️ CPI: 找不到同比列, columns={list(df.columns)}")
        return None

    months, yoy, mom, mom_months = [], [], [], []

    for _, row in df.iterrows():
        m = normalize_month(row[date_col])
        y = safe_float(row[yoy_col])
        if m and y is not None:
            months.append(m)
            yoy.append(y)

        if mom_col:
            m_val = safe_float(row[mom_col])
            if m and m_val is not None:
                mom_months.append(m)
                mom.append(m_val)

    if not months:
        return None
    return {
        "months": months, "yoy": yoy,
        "mom": mom, "momMonths": mom_months,
        "lastUpdate": months[-1] if months else None
    }


def fetch_ppi():
    """PPI 工业生产者出厂价格指数（同比 + 环比）"""
    import akshare as ak
    df = ak.macro_china_ppi()
    print(f"    PPI columns: {list(df.columns)}")

    date_col, yoy_col = None, None
    for c in df.columns:
        cs = str(c).strip()
        if cs in ('月份', '时间', '日期', 'date'):
            date_col = c
        elif '同比' in cs:
            yoy_col = c

    if not date_col:
        date_col = df.columns[0]
    if not yoy_col:
        for c in df.columns:
            if '同比' in str(c) or '增长' in str(c):
                yoy_col = c
                break

    if yoy_col is None:
        print(f"    ⚠️ PPI: 找不到同比列")
        return None

    months, yoy = [], []
    for _, row in df.iterrows():
        m = normalize_month(row[date_col])
        y = safe_float(row[yoy_col])
        if m and y is not None:
            months.append(m)
            yoy.append(y)

    if not months:
        return None
    return {
        "months": months, "yoy": yoy,
        "mom": [], "momMonths": [],
        "lastUpdate": months[-1] if months else None
    }


def fetch_pmi():
    """PMI 制造业采购经理指数"""
    import akshare as ak
    df = ak.macro_china_pmi()
    print(f"    PMI columns: {list(df.columns)}")

    date_col, pmi_col = None, None
    for c in df.columns:
        cs = str(c).strip()
        if cs in ('月份', '时间', '日期', 'date'):
            date_col = c
        elif '制造业' in cs and ('PMI' in cs or '指数' in cs):
            pmi_col = c
        elif cs == '制造业PMI':
            pmi_col = c

    if not date_col:
        date_col = df.columns[0]
    if not pmi_col:
        for c in df.columns:
            if '制造业' in str(c):
                pmi_col = c
                break

    if pmi_col is None:
        print(f"    ⚠️ PMI: 找不到制造业PMI列")
        return None

    months, pmi = [], []
    for _, row in df.iterrows():
        m = normalize_month(row[date_col])
        v = safe_float(row[pmi_col])
        if m and v is not None:
            months.append(m)
            pmi.append(v)

    if not months:
        return None
    return {"months": months, "pmi": pmi, "lastUpdate": months[-1]}


def fetch_trade():
    """进出口：出口金额当月同比 + 进口金额当月同比"""
    import akshare as ak
    df = ak.macro_china_trade_balance()
    print(f"    Trade columns: {list(df.columns)}")

    date_col = df.columns[0]
    export_col, import_col = None, None

    for c in df.columns:
        cs = str(c).strip()
        if '出口' in cs and ('同比' in cs or '增长' in cs):
            export_col = c
        elif '进口' in cs and ('同比' in cs or '增长' in cs):
            import_col = c

    if export_col is None or import_col is None:
        print(f"    ⚠️ Trade: 找不到进出口同比列")
        return None

    months, exps, imps = [], [], []
    for _, row in df.iterrows():
        m = normalize_month(row[date_col])
        e = safe_float(row[export_col])
        i = safe_float(row[import_col])
        if m and e is not None and i is not None:
            months.append(m)
            exps.append(e)
            imps.append(i)

    if not months:
        return None
    return {"months": months, "exportYoy": exps, "importYoy": imps,
            "lastUpdate": months[-1]}


def fetch_industrial():
    """工业增加值当月同比"""
    import akshare as ak
    df = ak.macro_china_gyzjz()
    print(f"    Industrial columns: {list(df.columns)}")

    date_col, yoy_col = None, None
    for c in df.columns:
        cs = str(c).strip()
        if cs in ('月份', '时间', '日期', 'date'):
            date_col = c
        elif '同比' in cs or '增长' in cs:
            yoy_col = c

    if not date_col:
        date_col = df.columns[0]
    if not yoy_col:
        for c in df.columns:
            if '同比' in str(c):
                yoy_col = c
                break

    if yoy_col is None:
        print(f"    ⚠️ Industrial: 找不到同比列")
        return None

    months, yoy = [], []
    for _, row in df.iterrows():
        m = normalize_month(row[date_col])
        y = safe_float(row[yoy_col])
        if m and y is not None:
            months.append(m)
            yoy.append(y)

    if not months:
        return None
    return {"months": months, "yoy": yoy, "lastUpdate": months[-1]}


def fetch_retail():
    """社零当月同比"""
    import akshare as ak
    df = ak.macro_china_consumer_goods_retail()
    print(f"    Retail columns: {list(df.columns)}")

    date_col, val_col = None, None
    for c in df.columns:
        cs = str(c).strip()
        if cs in ('月份', '时间', '日期', 'date'):
            date_col = c
        elif '当月' in cs or '同比' in cs or '增长' in cs:
            val_col = c

    if not date_col:
        date_col = df.columns[0]
    if not val_col:
        for c in df.columns:
            cs = str(c)
            if '当月' in cs:
                val_col = c
                break

    if val_col is None:
        val_col = df.columns[-1]

    months, vals = [], []
    for _, row in df.iterrows():
        m = normalize_month(row[date_col])
        v = safe_float(row[val_col])
        if m and v is not None:
            months.append(m)
            vals.append(v)

    # 如果值 > 100 可能是绝对值(亿元)，需要计算同比
    # 但 akshare 返回的列名为"当月同比增长"时就是同比
    # 如果是绝对值，计算 YoY
    if vals and max(vals) > 100:
        print(f"    Retail: 数据疑似绝对值(max={max(vals)})，计算同比...")
        yoy = []
        for i, v in enumerate(vals):
            if i < 12:
                yoy.append(None)
            else:
                prev = vals[i - 12]
                if prev and prev != 0:
                    yoy.append(round((v / prev - 1) * 100, 1))
                else:
                    yoy.append(None)
        vals = yoy
        # 去掉前12个None
        months = months[12:]

    # 过滤掉 None
    clean_months, clean_yoy = [], []
    for m, v in zip(months, vals):
        if v is not None:
            clean_months.append(m)
            clean_yoy.append(v)

    if not clean_months:
        return None
    return {"months": clean_months, "yoy": clean_yoy, "lastUpdate": clean_months[-1]}


def fetch_fai():
    """固定资产投资完成额累计同比"""
    import akshare as ak
    df = ak.macro_china_gdzctz()
    print(f"    FAI columns: {list(df.columns)}")

    date_col, yoy_col = None, None
    for c in df.columns:
        cs = str(c).strip()
        if cs in ('月份', '时间', '日期', 'date'):
            date_col = c
        elif '累计' in cs and ('同比' in cs or '增长' in cs):
            yoy_col = c
        elif '同比' in cs:
            yoy_col = c
        elif '增长' in cs:
            yoy_col = c

    if not date_col:
        date_col = df.columns[0]
    if not yoy_col:
        for c in df.columns:
            cs = str(c)
            if '同比' in cs or '增长' in cs:
                yoy_col = c
                break

    if yoy_col is None:
        print(f"    ⚠️ FAI: 找不到同比列")
        return None

    months, yoy = [], []
    for _, row in df.iterrows():
        m = normalize_month(row[date_col])
        y = safe_float(row[yoy_col])
        if m and y is not None:
            months.append(m)
            yoy.append(y)

    if not months:
        return None
    return {"months": months, "accumYoy": yoy, "lastUpdate": months[-1]}


def fetch_money_supply():
    """货币供应量 M0/M1/M2 同比"""
    import akshare as ak
    df = ak.macro_china_money_supply()
    print(f"    MoneySupply columns: {list(df.columns)}")

    date_col = df.columns[0]
    m0_col, m1_col, m2_col = None, None, None

    for c in df.columns:
        cs = str(c).strip()
        if 'M0' in cs and '同比' in cs:
            m0_col = c
        elif 'M1' in cs and '同比' in cs:
            m1_col = c
        elif 'M2' in cs and '同比' in cs:
            m2_col = c

    if m0_col is None or m1_col is None or m2_col is None:
        print(f"    ⚠️ MoneySupply: 找不到 M0/M1/M2 同比列")
        return None

    months, m0, m1, m2 = [], [], [], []
    for _, row in df.iterrows():
        m = normalize_month(row[date_col])
        v0 = safe_float(row[m0_col])
        v1 = safe_float(row[m1_col])
        v2 = safe_float(row[m2_col])
        if m and v2 is not None:
            months.append(m)
            m0.append(v0)
            m1.append(v1)
            m2.append(v2)

    if not months:
        return None
    return {"months": months, "m0": m0, "m1": m1, "m2": m2,
            "lastUpdate": months[-1]}


def fetch_electricity():
    """全社会用电量当月同比"""
    import akshare as ak
    df = ak.macro_china_society_electricity()
    print(f"    Electricity columns: {list(df.columns)}")

    date_col, yoy_col = None, None
    for c in df.columns:
        cs = str(c).strip()
        if cs in ('统计时间', '月份', '时间', '日期', 'date'):
            date_col = c
        elif '同比' in cs:
            yoy_col = c

    if not date_col:
        date_col = df.columns[0]
    if not yoy_col:
        for c in df.columns:
            if '同比' in str(c):
                yoy_col = c
                break

    if yoy_col is None:
        print(f"    ⚠️ Electricity: 找不到同比列")
        return None

    months, yoy = [], []
    for _, row in df.iterrows():
        m = normalize_month(row[date_col])
        y = safe_float(row[yoy_col])
        if m and y is not None:
            months.append(m)
            yoy.append(y)

    if not months:
        return None
    return {"months": months, "yoy": yoy, "lastUpdate": months[-1]}


def fetch_unemployment():
    """城镇调查失业率"""
    import akshare as ak
    df = ak.macro_china_urban_unemployment()
    print(f"    Unemployment columns: {list(df.columns)}")

    # 可能是长格式: date, item, value
    date_col, item_col, val_col = None, None, None
    for c in df.columns:
        cs = str(c).strip()
        if cs in ('date', '日期', '时间', '月份'):
            date_col = c
        elif cs in ('item', '指标', '类别'):
            item_col = c
        elif cs in ('value', '值', '数值'):
            val_col = c

    if date_col is None or val_col is None:
        # 试试另一种格式
        date_col = df.columns[0]
        for c in df.columns:
            cs = str(c)
            if '失业' in cs or '城镇' in cs:
                val_col = c
                break
        if val_col is None:
            val_col = df.columns[-1]

    months, rate = [], []
    for _, row in df.iterrows():
        m = normalize_month(row[date_col])

        # 如果有 item 列，筛选"全国城镇调查失业率"
        if item_col and '全国' not in str(row.get(item_col, '')):
            continue

        v = safe_float(row[val_col])
        if m and v is not None:
            months.append(m)
            rate.append(v)

    if not months:
        return None
    return {"months": months, "rate": rate, "lastUpdate": months[-1]}


def fetch_gdp():
    """GDP 不变价当季同比"""
    import akshare as ak
    df = ak.macro_china_gdp()
    print(f"    GDP columns: {list(df.columns)}")

    date_col, yoy_col = None, None
    for c in df.columns:
        cs = str(c).strip()
        if cs in ('季度', '时间', '日期', 'date'):
            date_col = c
        elif '同比' in cs and '国内' in cs:
            yoy_col = c
        elif '同比' in cs:
            yoy_col = c

    if not date_col:
        date_col = df.columns[0]
    if not yoy_col:
        for c in df.columns:
            if '同比' in str(c):
                yoy_col = c
                break

    if yoy_col is None:
        print(f"    ⚠️ GDP: 找不到同比列")
        return None

    quarters, yoy = [], []
    for _, row in df.iterrows():
        raw_date = str(row[date_col])
        # GDP 季度的日期格式多样: 2026Q1, 2026-03, 2026年1季度
        import re
        q = raw_date.strip()
        qm = re.match(r'(\d{4})Q(\d)', q)
        if qm:
            q_str = f"{qm.group(1)}年第{qm.group(2)}季度"
        else:
            # 尝试从月份推断季度
            m = normalize_month(q)
            if m:
                month_num = int(m[5:7])
                q_num = (month_num - 1) // 3 + 1
                q_str = f"{m[:4]}年第{q_num}季度"
            else:
                q_str = q  # 原样保留

        y = safe_float(row[yoy_col])
        if y is not None:
            quarters.append(q_str)
            yoy.append(y)

    if not quarters:
        return None
    return {"quarters": quarters, "yoy": yoy, "lastUpdate": quarters[-1]}


# ─── Mock 数据生成 ─────────────────────────────────────

def generate_mock_data():
    """生成 mock 数据用于测试"""
    import random
    random.seed(42)
    months = generate_mock_months()
    n = len(months)

    def make_indicator(base, noise=2.0):
        return [round(base + random.uniform(-noise, noise), 1) for _ in range(n)]

    def make_indicator_short(base, noise=1.0, count=30):
        return [round(base + random.uniform(-noise, noise), 1) for _ in range(count)]

    result = {
        "fetchTime": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "dataSource": "mock",
        "cpi": {
            "months": months, "yoy": make_indicator(2.0, 1.5),
            "mom": make_indicator_short(0.1, 0.5),
            "momMonths": months[-30:],
            "lastUpdate": months[-1]
        },
        "ppi": {
            "months": months, "yoy": make_indicator(-1.0, 3.0),
            "mom": make_indicator_short(0.0, 0.8),
            "momMonths": months[-30:],
            "lastUpdate": months[-1]
        },
        "pmi": {
            "months": months, "pmi": make_indicator(50.0, 2.0),
            "lastUpdate": months[-1]
        },
        "trade": {
            "months": months,
            "exportYoy": make_indicator(5.0, 10.0),
            "importYoy": make_indicator(3.0, 8.0),
            "lastUpdate": months[-1]
        },
        "industrial": {
            "months": months, "yoy": make_indicator(5.5, 3.0),
            "lastUpdate": months[-1]
        },
        "retail": {
            "months": months, "yoy": make_indicator(4.0, 3.0),
            "lastUpdate": months[-1]
        },
        "fai": {
            "months": months, "accumYoy": make_indicator(5.0, 4.0),
            "lastUpdate": months[-1]
        },
        "moneySupply": {
            "months": months,
            "m0": make_indicator(6.0, 2.0),
            "m1": make_indicator(3.0, 3.0),
            "m2": make_indicator(8.5, 2.0),
            "lastUpdate": months[-1]
        },
        "electricity": {
            "months": months, "yoy": make_indicator(6.0, 4.0),
            "lastUpdate": months[-1]
        },
        "unemployment": {
            "months": months, "rate": make_indicator(5.0, 0.5),
            "lastUpdate": months[-1]
        },
        "gdp": {
            "quarters": [f"{y}年第{q}季度" for y in range(2010, 2027)
                         for q in range(1, 3 if y == 2026 else 5)],
            "yoy": make_indicator(6.0, 2.0),
            "lastUpdate": "2026年第2季度"
        },
    }
    return result


# ─── 主入口 ────────────────────────────────────────────

FETCHERS = {
    "cpi": fetch_cpi, "ppi": fetch_ppi, "pmi": fetch_pmi,
    "trade": fetch_trade, "industrial": fetch_industrial,
    "retail": fetch_retail, "fai": fetch_fai,
    "moneySupply": fetch_money_supply, "electricity": fetch_electricity,
    "unemployment": fetch_unemployment, "gdp": fetch_gdp,
}


def fetch_all_akshare():
    """逐个指标抓取，一个失败不影响其他"""
    print(f"📡 从 akshare 获取宏观经济数据... {datetime.now()}")
    result = {
        "fetchTime": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "dataSource": "akshare",
    }

    success_count = 0
    for name, fetcher in FETCHERS.items():
        print(f"  {name}...")
        try:
            data = fetcher()
            if data:
                result[name] = data
                success_count += 1
                last_key = "lastUpdate"
                print(f"    ✅ {len(data.get('months', data.get('quarters', [])))} 条, "
                      f"更新至 {data.get(last_key, 'N/A')}")
            else:
                print(f"    ❌ 获取失败（返回空）")
        except Exception as e:
            print(f"    ❌ 异常: {e}")

    print(f"\n📊 成功获取 {success_count}/{len(FETCHERS)} 个指标")
    return result


def main():
    # 解析参数
    source = "akshare"
    for arg in sys.argv[1:]:
        if arg.startswith("--source="):
            source = arg.split("=", 1)[1]
        elif arg == "--source":
            idx = sys.argv.index("--source")
            if idx + 1 < len(sys.argv):
                source = sys.argv[idx + 1]

    # 从环境变量也可以覆盖
    env_source = os.environ.get("DATA_SOURCE", "")
    if env_source:
        source = env_source

    if source == "mock":
        print("🔧 使用 mock 数据模式")
        data = generate_mock_data()
    else:
        try:
            data = fetch_all_akshare()
        except ImportError:
            print("⚠️ akshare 未安装，回退到 mock 数据")
            print("    安装: pip install akshare")
            data = generate_mock_data()
        except Exception as e:
            print(f"❌ akshare 抓取失败: {e}")
            traceback.print_exc()
            data = generate_mock_data()

    # 保存
    out_path = os.path.join(OUTPUT_DIR, 'macro_data.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\n💾 已保存: {out_path}")
    print(f"📊 包含指标: {[k for k in data.keys() if k not in ('fetchTime', 'dataSource')]}")

    # 检查缺失
    expected = list(FETCHERS.keys())
    missing = [k for k in expected if k not in data]
    if missing:
        print(f"⚠️ 缺失指标: {missing}")
    else:
        print("✅ 所有指标获取成功")


if __name__ == '__main__':
    main()
