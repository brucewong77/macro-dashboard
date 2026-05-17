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


from typing import Optional, Dict, List, Any

def safe_float(val) -> Optional[float]:
    """安全转换为浮点数"""
    if pd.isna(val):
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None




def is_date_like(series: pd.Series) -> bool:
    """检查 Series 的值是否像日期格式（如 2024-06、2024年06月）"""
    non_null = series.dropna().astype(str)
    if non_null.empty:
        return False
    # 采样前10个非空值
    samples = non_null.head(10)
    date_pattern = re.compile(r'^(\d{4}[-/年]\d{1,2}|\d{4}-\d{2}-\d{2}|\d{6})$')
    match_count = sum(1 for v in samples if date_pattern.match(str(v).strip()))
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
        # 优先匹配明确的日期列名
        if any(k in col_str for k in ['date', '时间', '月份', '日期', 'period', 'time']):
            if is_date_like(df[col]):
                candidates.append((col, 100))  # 高优先级
        # 次优先：值看起来像日期
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
        
        # 关键词匹配
        if keywords:
            for kw in keywords:
                if kw.lower() in col_str:
                    score += 50
        
        # 数值特征
        if is_numeric_like(df[col]):
            score += 30
        
        if score > 0:
            candidates.append((col, score))
    
    if candidates:
        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[0][0]
    
    # 兜底：找第一个非日期列且看起来像数值的列
    for col in df.columns:
        if col != exclude_col and is_numeric_like(df[col]):
            return col
    
    # 最终兜底
    for col in df.columns:
        if col != exclude_col:
            return col
    return df.columns[1]


def validate_indicator(data: dict, indicator_name: str) -> bool:
    """验证抓取的数据是否有效"""
    if "error" in data:
        print(f"  ⚠️ {indicator_name}: 抓取报错 - {data['error']}")
        return False
    
    value = data.get("value")
    date = data.get("date")
    history = data.get("history", [])
    
    # 检查 value 是否为 None
    if value is None:
        print(f"  ⚠️ {indicator_name}: value 为 None")
        return False
    
    # 检查 date 是否像日期（而不是报告名称）
    if date and isinstance(date, str):
        date_pattern = re.compile(r'^(\d{4}[-/年]\d{1,2}|\d{4}-\d{2}-\d{2}|\d{6}|\d{4}Q\d)$')
        if not date_pattern.match(date.strip()):
            print(f"  ⚠️ {indicator_name}: date 格式异常 '{date}'")
            return False
    
    # 检查 history 中是否有有效数据
    if history:
        valid_count = sum(1 for h in history if h.get("value") is not None)
        if valid_count == 0:
            print(f"  ⚠️ {indicator_name}: history 中无有效数值")
            return False
    
    print(f"  ✓ {indicator_name}: 验证通过 (value={value}, date={date})")
    return True

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
        
        print(f"[CPI] DataFrame shape={df.shape}, columns={list(df.columns)}")
        print(f"[CPI] Sample rows:\n{df.head(3).to_string()}")

        date_col = pick_date_column(df)
        value_col = pick_value_column(df, date_col, keywords=["全国", "cpi", "指数", "同比", "value"])
        
        print(f"[CPI] Selected date_col={date_col}, value_col={value_col}")

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
        
        print(f"[PPI] DataFrame shape={df.shape}, columns={list(df.columns)}")
        print(f"[PPI] Sample rows:\n{df.head(3).to_string()}")

        date_col = pick_date_column(df)
        value_col = pick_value_column(df, date_col, keywords=["ppi", "同比", "value", "工业"])
        
        print(f"[PPI] Selected date_col={date_col}, value_col={value_col}")

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
    
    # 先加载旧数据作为回退
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
            # 使用旧数据回退
            if key in old_indicators and "error" not in old_indicators[key]:
                indicators[key] = old_indicators[key]
                print(f"  ↺ {key}: 使用旧数据回退")
            else:
                indicators[key] = result  # 保留错误信息
        elif validate_indicator(result, key):
            indicators[key] = result
        else:
            errors[key] = "validation_failed"
            # 使用旧数据回退
            if key in old_indicators and "error" not in old_indicators[key]:
                indicators[key] = old_indicators[key]
                print(f"  ↺ {key}: 验证失败，使用旧数据回退")
            else:
                indicators[key] = result  # 保留新数据（即使无效，也保留用于调试）

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
    
    # 只要有部分数据成功，就不退出失败
    if valid_count == 0:
        print("所有指标均抓取失败！")
        sys.exit(1)


if __name__ == "__main__":
    main()
