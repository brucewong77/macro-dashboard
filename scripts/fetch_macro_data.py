#!/usr/bin/env python3
"""
宏观经济数据自动抓取脚本
使用 AkShare 从国家统计局、央行等获取最新数据
"""

import json
import os
import sys
import traceback
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd

# 确保输出目录存在
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "public" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = DATA_DIR / "macro_data.json"


def safe_float(val) -> float | None:
    """安全转换为浮点数"""
    if pd.isna(val):
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def get_latest_and_change(series: pd.Series, dates: pd.Series) -> dict:
    """从序列中获取最新值、前值和环比变化"""
    if series.empty or len(series) < 2:
        return {"value": None, "prev": None, "change": None, "change_pct": None}

    latest = safe_float(series.iloc[-1])
    prev = safe_float(series.iloc[-2])
    change = None
    change_pct = None
    if latest is not None and prev is not None and prev != 0:
        change = round(latest - prev, 2)
        change_pct = round((latest - prev) / abs(prev) * 100, 2)

    latest_date = str(dates.iloc[-1]) if not dates.empty else None

    return {
        "value": latest,
        "prev": prev,
        "change": change,
        "change_pct": change_pct,
        "date": latest_date,
    }


def fetch_cpi() -> dict:
    """获取 CPI 数据"""
    try:
        import akshare as ak

        df = ak.macro_china_cpi_monthly()
        if df is None or df.empty:
            return {"error": "empty data"}

        # AkShare CPI 月接口通常有 '月份' 和 '全国-当月' 等列
        # 列名可能变化，做兼容处理
        date_col = None
        value_col = None
        for col in df.columns:
            col_str = str(col)
            if "月" in col_str or "date" in col_str.lower() or "时间" in col_str:
                date_col = col
            if "全国" in col_str or "cpi" in col_str.lower() or "指数" in col_str:
                if value_col is None or "当月" in col_str:
                    value_col = col

        if date_col is None:
            date_col = df.columns[0]
        if value_col is None:
            value_col = df.columns[1]

        df = df.sort_values(by=date_col).reset_index(drop=True)
        latest = get_latest_and_change(df[value_col], df[date_col])

        # 历史数据（最近 24 个月）
        history = []
        for _, row in df.tail(24).iterrows():
            history.append({
                "date": str(row[date_col]),
                "value": safe_float(row[value_col]),
            })

        return {
            **latest,
            "name": "CPI同比",
            "unit": "%",
            "history": history,
        }
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


def fetch_ppi() -> dict:
    """获取 PPI 数据"""
    try:
        import akshare as ak

        df = ak.macro_china_ppi_yearly()
        if df is None or df.empty:
            return {"error": "empty data"}

        date_col = df.columns[0]
        value_col = df.columns[1]

        df = df.sort_values(by=date_col).reset_index(drop=True)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = []
        for _, row in df.tail(24).iterrows():
            history.append({
                "date": str(row[date_col]),
                "value": safe_float(row[value_col]),
            })

        return {
            **latest,
            "name": "PPI同比",
            "unit": "%",
            "history": history,
        }
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

        date_col = df.columns[0]
        # 通常有 '制造业-制造业PMI' 或类似列
        value_col = None
        for col in df.columns:
            if "制造业" in str(col) and "PMI" in str(col):
                value_col = col
                break
        if value_col is None:
            value_col = df.columns[1]

        df = df.sort_values(by=date_col).reset_index(drop=True)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = []
        for _, row in df.tail(24).iterrows():
            history.append({
                "date": str(row[date_col]),
                "value": safe_float(row[value_col]),
            })

        return {
            **latest,
            "name": "制造业PMI",
            "unit": "",
            "history": history,
        }
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


def fetch_gdp() -> dict:
    """获取 GDP 数据（季度）"""
    try:
        import akshare as ak

        df = ak.macro_china_gdp()
        if df is None or df.empty:
            return {"error": "empty data"}

        date_col = df.columns[0]
        # 找当季同比或 GDP 绝对值
        value_col = None
        for col in df.columns:
            col_str = str(col)
            if "当季" in col_str or "同比" in col_str:
                value_col = col
                break
        if value_col is None:
            value_col = df.columns[1]

        df = df.sort_values(by=date_col).reset_index(drop=True)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = []
        for _, row in df.tail(12).iterrows():
            history.append({
                "date": str(row[date_col]),
                "value": safe_float(row[value_col]),
            })

        return {
            **latest,
            "name": "GDP增速",
            "unit": "%",
            "history": history,
        }
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

        date_col = df.columns[0]
        value_col = None
        for col in df.columns:
            if "M2" in str(col) and "同比" in str(col):
                value_col = col
                break
        if value_col is None:
            # 备选
            for col in df.columns:
                if "M2" in str(col):
                    value_col = col
                    break
        if value_col is None:
            value_col = df.columns[1]

        df = df.sort_values(by=date_col).reset_index(drop=True)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = []
        for _, row in df.tail(24).iterrows():
            history.append({
                "date": str(row[date_col]),
                "value": safe_float(row[value_col]),
            })

        return {
            **latest,
            "name": "M2同比增速",
            "unit": "%",
            "history": history,
        }
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
        # 1年期 LPR
        value_col = None
        for col in df.columns:
            if "1年" in str(col) or "1Y" in str(col):
                value_col = col
                break
        if value_col is None:
            value_col = df.columns[1]

        df = df.sort_values(by=date_col).reset_index(drop=True)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = []
        for _, row in df.tail(24).iterrows():
            history.append({
                "date": str(row[date_col]),
                "value": safe_float(row[value_col]),
            })

        return {
            **latest,
            "name": "LPR(1年)",
            "unit": "%",
            "history": history,
        }
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

        df = df.sort_values(by=date_col).reset_index(drop=True)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = []
        for _, row in df.tail(24).iterrows():
            history.append({
                "date": str(row[date_col]),
                "value": safe_float(row[value_col]),
            })

        return {
            **latest,
            "name": "失业率",
            "unit": "%",
            "history": history,
        }
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


def fetch_fx_reserves() -> dict:
    """获取外汇储备"""
    try:
        import akshare as ak

        df = ak.macro_china_fx_reserves()
        if df is None or df.empty:
            return {"error": "empty data"}

        date_col = df.columns[0]
        value_col = df.columns[1]

        df = df.sort_values(by=date_col).reset_index(drop=True)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = []
        for _, row in df.tail(24).iterrows():
            history.append({
                "date": str(row[date_col]),
                "value": safe_float(row[value_col]),
            })

        return {
            **latest,
            "name": "外汇储备",
            "unit": "万亿美元",
            "history": history,
        }
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


def fetch_retail_sales() -> dict:
    """获取社会消费品零售总额同比"""
    try:
        import akshare as ak

        df = ak.macro_china_retail_sales()
        if df is None or df.empty:
            return {"error": "empty data"}

        date_col = df.columns[0]
        value_col = df.columns[1]

        df = df.sort_values(by=date_col).reset_index(drop=True)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = []
        for _, row in df.tail(24).iterrows():
            history.append({
                "date": str(row[date_col]),
                "value": safe_float(row[value_col]),
            })

        return {
            **latest,
            "name": "社零同比",
            "unit": "%",
            "history": history,
        }
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


def fetch_fixed_asset_investment() -> dict:
    """获取固定资产投资累计同比"""
    try:
        import akshare as ak

        df = ak.macro_china_fixed_asset_investment()
        if df is None or df.empty:
            return {"error": "empty data"}

        date_col = df.columns[0]
        value_col = df.columns[1]

        df = df.sort_values(by=date_col).reset_index(drop=True)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = []
        for _, row in df.tail(24).iterrows():
            history.append({
                "date": str(row[date_col]),
                "value": safe_float(row[value_col]),
            })

        return {
            **latest,
            "name": "固投累计同比",
            "unit": "%",
            "history": history,
        }
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


def fetch_export() -> dict:
    """获取出口同比"""
    try:
        import akshare as ak

        df = ak.macro_china_export()
        if df is None or df.empty:
            return {"error": "empty data"}

        date_col = df.columns[0]
        value_col = df.columns[1]

        df = df.sort_values(by=date_col).reset_index(drop=True)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = []
        for _, row in df.tail(24).iterrows():
            history.append({
                "date": str(row[date_col]),
                "value": safe_float(row[value_col]),
            })

        return {
            **latest,
            "name": "出口同比",
            "unit": "%",
            "history": history,
        }
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
        value_col = None
        for col in df.columns:
            if "存量" in str(col) or "增速" in str(col):
                value_col = col
                break
        if value_col is None:
            value_col = df.columns[1]

        df = df.sort_values(by=date_col).reset_index(drop=True)
        latest = get_latest_and_change(df[value_col], df[date_col])

        history = []
        for _, row in df.tail(24).iterrows():
            history.append({
                "date": str(row[date_col]),
                "value": safe_float(row[value_col]),
            })

        return {
            **latest,
            "name": "社融存量增速",
            "unit": "%",
            "history": history,
        }
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


def build_calendar(indicators: dict) -> list:
    """构建数据发布日历（简化版，可根据实际发布时间调整）"""
    today = datetime.now()
    calendar = []

    # 统计局常规发布时间（每月 9-17 号）
    schedule = [
        ("CPI、PPI", 10),
        ("固定资产投资", 15),
        ("社会消费品零售总额", 15),
        ("LPR报价", 20),
        ("社融、M2", 10),
        ("外汇储备", 7),
        ("PMI", 31),
    ]

    for name, day in schedule:
        status = "待发布"
        if today.day > day + 2:
            status = "已发布"
        elif today.day >= day - 1:
            status = "即将发布"

        calendar.append({
            "name": name,
            "expected_day": day,
            "status": status,
        })

    return calendar


def main():
    print(f"[{datetime.now()}] 开始抓取宏观经济数据...")

    indicators = {
        "gdp": fetch_gdp(),
        "cpi": fetch_cpi(),
        "ppi": fetch_ppi(),
        "pmi": fetch_pmi(),
        "m2": fetch_money_supply(),
        "lpr": fetch_lpr(),
        "unemployment": fetch_unemployment(),
        "fx_reserves": fetch_fx_reserves(),
        "retail_sales": fetch_retail_sales(),
        "fixed_asset_investment": fetch_fixed_asset_investment(),
        "export": fetch_export(),
        "shrzgm": fetch_shrzgm(),
    }

    # 过滤掉出错的指标
    errors = {k: v.pop("error") for k, v in indicators.items() if "error" in v}
    if errors:
        print("以下指标抓取失败：")
        for k, msg in errors.items():
            print(f"  - {k}: {msg}")

    output = {
        "update_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "indicators": indicators,
        "calendar": build_calendar(indicators),
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"[{datetime.now()}] 数据已保存至 {OUTPUT_FILE}")
    print(f"成功抓取 {len(indicators) - len(errors)} / {len(indicators)} 个指标")

    # 如果有严重错误，返回非零退出码（但不影响已成功的数据写入）
    if len(errors) == len(indicators):
        print("所有指标均抓取失败！")
        sys.exit(1)


if __name__ == "__main__":
    main()
