#!/usr/bin/env python3
"""
宏观经济数据自动抓取脚本
使用 AkShare 从国家统计局、央行等获取最新数据
"""

import json
import os
import re
import sys
import traceback
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd

# 确保输出目录存在
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "public" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = DATA_DIR / "macro_data.json"

# 支持多种日期格式：2026年04月份、2026年第1季度、2026-04-01、202604 等
DATE_PATTERN = re.compile(
    r'^(\d{4}[-/年]\d{1,2}(月|份)?$'
    r'|\d{4}-\d{2}-\d{2}$'
    r'|\d{6}$'
    r'|\d{4}Q\d$'
    r'|\d{4}年第\d季度$'
    r'|\d{4}年第1-[234]季度$)'
)


def safe_float(val) -> Optional[float]:
    """安全转换为浮点数"""
    try:
        if pd.isna(val):
            return None
    except (TypeError, ValueError):
        pass
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def is_date_like(series: pd.Series) -> bool:
    """检查 Series 的值是否像日期格式"""
    non_null = series.dropna().astype(str)
    if non_null.empty:
        return False
    samples = non_null.head(10)
    match_count = sum(1 for v in samples if DATE_PATTERN.match(str(v).strip()))
    return match_count >= len(samples) * 0.5


def is_numeric_like(series: pd.Series) -> bool:
    """检查 Series 的值是否主要是数字"""
    non_null = series.dropna()
    if len(non_null) == 0:
        return False
    numeric_count = 0
    for val in non_null.head(10):
        try:
            float(val)
            numeric_count += 1
        except (ValueError, TypeError):
            pass
    return numeric_count >= len(non_null.head(10)) * 0.5


def pick_date_column(df: pd.DataFrame) -> str:
    """智能选择日期列"""
    candidates = []
    for col in df.columns:
        col_str = str(col).lower()
        if any(k in col_str for k in ['date', '时间', '月份', '日期', 'period', 'time', '季度', '月']):
            if is_date_like(df[col]):
                candidates.append((col, 100))
        elif is_date_like(df[col]):
            candidates.append((col, 50))

    if candidates:
        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[0][0]
    return df.columns[0]


def pick_value_column(df: pd.DataFrame, exclude_col: str, keywords: list = None) -> str:
    """智能选择数值列"""
    candidates = []
    for col in df.columns:
        if col == exclude_col:
            continue
        col_str = str(col).lower()
        score = 0

        if keywords:
            for kw in keywords:
                if kw.lower() in col_str:
                    score += 50

        if is_numeric_like(df[col]):
            score += 30

        if score > 0:
            candidates.append((col, score))

    if candidates:
        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[0][0]

    for col in df.columns:
        if col != exclude_col and is_numeric_like(df[col]):
            return col

    for col in df.columns:
        if col != exclude_col:
            return col
    return df.columns[1]


def sort_df_by_date(df: pd.DataFrame, date_col: str) -> pd.DataFrame:
    """按日期列排序（处理中文日期字符串，升序）"""
    def date_key(s):
        s = str(s)
        # 替换中文为排序友好格式
        s = re.sub(r'年第(\d)-(\d)季度', r'Q\2', s)
        s = re.sub(r'年第(\d)季度', r'Q\1', s)
        s = s.replace('年', '-').replace('月份', '').replace('月', '')
        return s
    df = df.copy()
    df['_sort_key'] = df[date_col].astype(str).apply(date_key)
    df = df.sort_values('_sort_key').drop(columns=['_sort_key']).reset_index(drop=True)
    return df


def get_latest_and_change(series: pd.Series, dates: pd.Series) -> dict:
    """从序列中获取最新非空值、前值和环比变化"""
    # 过滤掉末尾 NaN（预告占位行）
    valid_mask = series.notna()
    valid_series = series[valid_mask]
    valid_dates = dates[valid_mask]

    if valid_series.empty or len(valid_series) < 1:
        return {"value": None, "prev": None, "change": None, "change_pct": None, "date": None}

    latest = safe_float(valid_series.iloc[-1])
    prev = safe_float(valid_series.iloc[-2]) if len(valid_series) >= 2 else None
    change = None
    change_pct = None
    if latest is not None and prev is not None and prev != 0:
        change = round(latest - prev, 2)
        change_pct = round((latest - prev) / abs(prev) * 100, 2)

    latest_date = str(valid_dates.iloc[-1]) if not valid_dates.empty else None

    return {
        "value": latest,
        "prev": prev,
        "change": change,
        "change_pct": change_pct,
        "date": latest_date,
    }


def validate_indicator(data: dict, indicator_name: str) -> bool:
    """验证抓取的数据是否有效"""
    if "error" in data:
        print(f"  ⚠️ {indicator_name}: 抓取报错 - {data['error']}")
        return False

    value = data.get("value")
    history = data.get("history", [])

    if value is None:
        print(f"  ⚠️ {indicator_name}: value 为 None")
        return False

    if history:
        valid_count = sum(1 for h in history if h.get("value") is not None)
        if valid_count == 0:
            print(f"  ⚠️ {indicator_name}: history 中无有效数值")
            return False

    print(f"  ✓ {indicator_name}: 验证通过 (value={value}, date={data.get('date')})")
    return True


# ─────────────── 各指标抓取函数 ───────────────

def fetch_gdp() -> dict:
    """获取 GDP 数据（季度同比）"""
    try:
        import akshare as ak
        df = ak.macro_china_gdp()
        if df is None or df.empty:
            return {"error": "empty data"}

        date_col = df.columns[0]  # '季度'
        # 找同比增长列
        value_col = next((c for c in df.columns if "同比" in str(c) and "国内生产总值" in str(c)), None)
        if value_col is None:
            value_col = df.columns[2]  # '国内生产总值-同比增长'

        df = sort_df_by_date(df, date_col)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = [
            {"date": str(row[date_col]), "value": safe_float(row[value_col])}
            for _, row in df.tail(12).iterrows()
        ]
        return {**latest, "name": "GDP同比", "unit": "%", "history": history}
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


def fetch_cpi() -> dict:
    """获取 CPI 数据（月同比）"""
    try:
        import akshare as ak
        # macro_china_cpi_monthly 数据来自金十，日期格式为 2025-08-09（发布日而非统计月）
        # 改用 macro_china_cpi_yearly 或 macro_china_cpi，按需选择
        df = ak.macro_china_cpi()
        if df is None or df.empty:
            return {"error": "empty data"}

        print(f"[CPI] columns={list(df.columns)}, shape={df.shape}")
        print(df.head(3).to_string())

        date_col = pick_date_column(df)
        value_col = pick_value_column(df, date_col, keywords=["全国", "同比", "cpi", "居民"])

        df = sort_df_by_date(df, date_col)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = [
            {"date": str(row[date_col]), "value": safe_float(row[value_col])}
            for _, row in df.tail(24).iterrows()
        ]
        return {**latest, "name": "CPI同比", "unit": "%", "history": history}
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


def fetch_ppi() -> dict:
    """获取 PPI 数据（工业品出厂价格同比）"""
    try:
        import akshare as ak
        df = ak.macro_china_ppi()
        if df is None or df.empty:
            return {"error": "empty data"}

        print(f"[PPI] columns={list(df.columns)}, shape={df.shape}")
        print(df.head(3).to_string())

        date_col = pick_date_column(df)
        value_col = pick_value_column(df, date_col, keywords=["同比", "ppi", "工业", "全部"])

        df = sort_df_by_date(df, date_col)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = [
            {"date": str(row[date_col]), "value": safe_float(row[value_col])}
            for _, row in df.tail(24).iterrows()
        ]
        return {**latest, "name": "PPI同比", "unit": "%", "history": history}
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


def fetch_pmi() -> dict:
    """获取制造业 PMI"""
    try:
        import akshare as ak
        df = ak.macro_china_pmi()
        if df is None or df.empty:
            return {"error": "empty data"}

        date_col = df.columns[0]  # '月份'，格式 2026年04月份
        value_col = next((c for c in df.columns if "制造业" in str(c) and "指数" in str(c)), df.columns[1])

        df = sort_df_by_date(df, date_col)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = [
            {"date": str(row[date_col]), "value": safe_float(row[value_col])}
            for _, row in df.tail(24).iterrows()
        ]
        return {**latest, "name": "制造业PMI", "unit": "", "history": history}
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


def fetch_money_supply() -> dict:
    """获取 M2 同比"""
    try:
        import akshare as ak
        df = ak.macro_china_money_supply()
        if df is None or df.empty:
            return {"error": "empty data"}

        date_col = df.columns[0]  # '月份'
        value_col = next(
            (c for c in df.columns if "M2" in str(c) and "同比" in str(c)), None
        )
        if value_col is None:
            value_col = next((c for c in df.columns if "M2" in str(c)), df.columns[1])

        df = sort_df_by_date(df, date_col)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = [
            {"date": str(row[date_col]), "value": safe_float(row[value_col])}
            for _, row in df.tail(24).iterrows()
        ]
        return {**latest, "name": "M2同比增速", "unit": "%", "history": history}
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


def fetch_lpr() -> dict:
    """获取 LPR 报价"""
    try:
        import akshare as ak
        df = ak.macro_china_lpr()
        if df is None or df.empty:
            return {"error": "empty data"}

        date_col = df.columns[0]
        value_col = next(
            (c for c in df.columns if "1年" in str(c) or "1Y" in str(c).upper()),
            df.columns[1]
        )

        df = sort_df_by_date(df, date_col)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = [
            {"date": str(row[date_col]), "value": safe_float(row[value_col])}
            for _, row in df.tail(24).iterrows()
        ]
        return {**latest, "name": "LPR(1年)", "unit": "%", "history": history}
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


def fetch_unemployment() -> dict:
    """获取城镇调查失业率"""
    try:
        import akshare as ak
        df = ak.macro_china_urban_unemployment()
        if df is None or df.empty:
            return {"error": "empty data"}

        date_col = df.columns[0]
        value_col = df.columns[1]

        df = sort_df_by_date(df, date_col)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = [
            {"date": str(row[date_col]), "value": safe_float(row[value_col])}
            for _, row in df.tail(24).iterrows()
        ]
        return {**latest, "name": "失业率", "unit": "%", "history": history}
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


def fetch_fx_reserves() -> dict:
    """获取外汇储备（外汇黄金储备表）"""
    try:
        import akshare as ak
        df = ak.macro_china_fx_gold()
        if df is None or df.empty:
            return {"error": "empty data"}

        print(f"[FX] columns={list(df.columns)}")
        print(df.tail(2).to_string())

        date_col = pick_date_column(df)
        # 找外汇储备列（单位：亿美元）
        value_col = next(
            (c for c in df.columns if "外汇" in str(c) and c != date_col),
            None
        )
        if value_col is None:
            value_col = pick_value_column(df, date_col, keywords=["外汇", "储备", "亿"])

        df = sort_df_by_date(df, date_col)
        latest = get_latest_and_change(df[value_col], df[date_col])
        # 转为万亿（原始单位通常为亿美元）
        if latest["value"] and latest["value"] > 100:
            latest["value"] = round(latest["value"] / 10000, 2)
            if latest["prev"]:
                latest["prev"] = round(latest["prev"] / 10000, 2)
            if latest["change"]:
                latest["change"] = round(latest["change"] / 10000, 4)

        history = [
            {"date": str(row[date_col]), "value": round(safe_float(row[value_col]) / 10000, 2)
             if safe_float(row[value_col]) and safe_float(row[value_col]) > 100 else safe_float(row[value_col])}
            for _, row in df.tail(24).iterrows()
        ]
        return {**latest, "name": "外汇储备", "unit": "万亿美元", "history": history}
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


def fetch_retail_sales() -> dict:
    """获取社会消费品零售总额同比"""
    try:
        import akshare as ak
        df = ak.macro_china_consumer_goods_retail()
        if df is None or df.empty:
            return {"error": "empty data"}

        print(f"[retail] columns={list(df.columns)}")
        print(df.tail(2).to_string())

        date_col = pick_date_column(df)
        value_col = pick_value_column(df, date_col, keywords=["同比", "增长", "零售"])

        df = sort_df_by_date(df, date_col)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = [
            {"date": str(row[date_col]), "value": safe_float(row[value_col])}
            for _, row in df.tail(24).iterrows()
        ]
        return {**latest, "name": "社零同比", "unit": "%", "history": history}
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


def fetch_fixed_asset_investment() -> dict:
    """获取固定资产投资累计同比"""
    try:
        import akshare as ak
        df = ak.macro_china_gdzctz()
        if df is None or df.empty:
            return {"error": "empty data"}

        print(f"[FAI] columns={list(df.columns)}")
        print(df.tail(2).to_string())

        date_col = pick_date_column(df)
        value_col = pick_value_column(df, date_col, keywords=["同比", "增长", "固定"])

        df = sort_df_by_date(df, date_col)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = [
            {"date": str(row[date_col]), "value": safe_float(row[value_col])}
            for _, row in df.tail(24).iterrows()
        ]
        return {**latest, "name": "固投累计同比", "unit": "%", "history": history}
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


def fetch_export() -> dict:
    """获取出口同比（以美元计）"""
    try:
        import akshare as ak
        df = ak.macro_china_exports_yoy()
        if df is None or df.empty:
            return {"error": "empty data"}

        print(f"[export] columns={list(df.columns)}")
        print(df.tail(3).to_string())

        # 格式同 CPI: ['商品', '日期', '今值', '预测值', '前值']，日期为发布日
        date_col = "日期" if "日期" in df.columns else pick_date_column(df)
        value_col = "今值" if "今值" in df.columns else pick_value_column(df, date_col)

        df = df.sort_values(by=date_col).reset_index(drop=True)
        # 过滤掉 NaN
        df_valid = df[df[value_col].notna()].reset_index(drop=True)
        latest = get_latest_and_change(df_valid[value_col], df_valid[date_col])

        history = [
            {"date": str(row[date_col]), "value": safe_float(row[value_col])}
            for _, row in df_valid.tail(24).iterrows()
        ]
        return {**latest, "name": "出口同比", "unit": "%", "history": history}
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


def fetch_shrzgm() -> dict:
    """获取社融存量增速"""
    try:
        import akshare as ak
        df = ak.macro_china_shrzgm()
        if df is None or df.empty:
            return {"error": "empty data"}

        date_col = df.columns[0]
        value_col = next(
            (c for c in df.columns if "存量" in str(c) or "增速" in str(c)),
            df.columns[1]
        )

        df = sort_df_by_date(df, date_col)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = [
            {"date": str(row[date_col]), "value": safe_float(row[value_col])}
            for _, row in df.tail(24).iterrows()
        ]
        return {**latest, "name": "社融存量增速", "unit": "%", "history": history}
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


# ─────────────── 日历 & 主函数 ───────────────

def build_calendar(indicators: dict) -> list:
    """构建数据发布日历，正确处理跨月边界"""
    today = datetime.now()
    calendar = []

    schedule = [
        ("外汇储备", 7),
        ("CPI、PPI", 10),
        ("社融、M2", 10),
        ("固定资产投资", 15),
        ("社会消费品零售总额", 15),
        ("LPR报价", 20),
        ("PMI", 31),
    ]

    for name, day in schedule:
        actual_day = min(day, 28)
        if today.day > actual_day + 2:
            status = "已发布"
        elif today.day >= actual_day - 1:
            status = "即将发布"
        else:
            status = "待发布"

        calendar.append({"name": name, "expected_day": day, "status": status})

    return calendar


def load_old_data() -> dict:
    """加载旧数据作为回退"""
    try:
        if OUTPUT_FILE.exists():
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"加载旧数据失败: {e}")
    return {"indicators": {}}


def main():
    print(f"[{datetime.now()}] 开始抓取宏观经济数据...")

    old_data = load_old_data()
    old_indicators = old_data.get("indicators", {})
    print(f"旧数据包含 {len(old_indicators)} 个指标")

    fetchers = {
        "gdp": fetch_gdp,
        "cpi": fetch_cpi,
        "ppi": fetch_ppi,
        "pmi": fetch_pmi,
        "m2": fetch_money_supply,
        "lpr": fetch_lpr,
        "unemployment": fetch_unemployment,
        "fx_reserves": fetch_fx_reserves,
        "retail_sales": fetch_retail_sales,
        "fixed_asset_investment": fetch_fixed_asset_investment,
        "export": fetch_export,
        "shrzgm": fetch_shrzgm,
    }

    indicators = {}
    errors = {}

    for key, fetcher in fetchers.items():
        print(f"\n[{key}] 开始抓取...")
        result = fetcher()

        if "error" in result:
            errors[key] = result["error"]
            print(f"  ✗ {key}: 抓取失败 - {result['error']}")
            if key in old_indicators and "error" not in old_indicators[key]:
                indicators[key] = old_indicators[key]
                print(f"  ↺ {key}: 使用旧数据回退")
            else:
                indicators[key] = result
        elif validate_indicator(result, key):
            indicators[key] = result
        else:
            errors[key] = "validation_failed"
            if key in old_indicators and "error" not in old_indicators[key]:
                indicators[key] = old_indicators[key]
                print(f"  ↺ {key}: 验证失败，使用旧数据回退")
            else:
                indicators[key] = result

    if errors:
        print(f"\n⚠️ 以下指标抓取或验证失败（已尝试回退到旧数据）：")
        for k, msg in errors.items():
            print(f"  - {k}: {msg}")

    output = {
        "update_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "indicators": indicators,
        "calendar": build_calendar(indicators),
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n[{datetime.now()}] 数据已保存至 {OUTPUT_FILE}")
    valid_count = sum(1 for v in indicators.values() if "error" not in v)
    print(f"有效指标: {valid_count} / {len(indicators)}")

    if valid_count == 0:
        print("所有指标均抓取失败！")
        sys.exit(1)


if __name__ == "__main__":
    main()
