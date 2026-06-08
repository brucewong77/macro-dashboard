#!/usr/bin/env python3
"""
宏观经济数据自动爬取脚本
使用 AkShare 开源库从国家统计局、新浪财经等数据源获取数据
"""

import json
import os
import sys
from datetime import datetime, timedelta

# 尝试导入 akshare，如果失败则使用备用方案
try:
    import akshare as ak
    AKSHARE_AVAILABLE = True
except ImportError:
    AKSHARE_AVAILABLE = False
    print("警告: akshare 未安装，将使用模拟数据模式")

# 数据输出目录
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_date_range(start_year=2024, start_month=1, end_year=2026, end_month=3):
    """生成月份列表"""
    months = []
    y, m = start_year, start_month
    while (y < end_year) or (y == end_year and m <= end_month):
        months.append(f"{y}-{m:02d}")
        m += 1
        if m > 12:
            m = 1
            y += 1
    return months


def fetch_cpi_data():
    """获取CPI数据"""
    try:
        if AKSHARE_AVAILABLE:
            df = ak.macro_china_cpi()
            df = df.sort_values('月')
            # 筛选2024-2026年数据
            df = df[df['月'] >= '2024-01']
            df = df[df['月'] <= '2026-03']
            yoy = df['全国-同比增长'].tolist() if '全国-同比增长' in df.columns else []
            mom = df['全国-环比增长'].tolist() if '全国-环比增长' in df.columns else []
            months_list = df['月'].tolist()
            print(f"CPI数据获取成功: {len(months_list)}条")
            return {
                'months': months_list,
                'yoy': yoy,
                'mom': mom,
                'lastUpdate': months_list[-1] if months_list else None
            }
    except Exception as e:
        print(f"CPI数据获取失败: {e}")
    return None


def fetch_ppi_data():
    """获取PPI数据"""
    try:
        if AKSHARE_AVAILABLE:
            df = ak.macro_china_ppi()
            df = df.sort_values('月')
            df = df[df['月'] >= '2024-01']
            df = df[df['月'] <= '2026-03']
            yoy = df['当月'].tolist() if '当月' in df.columns else []
            mom = df['当月同比增长'].tolist() if '当月同比增长' in df.columns else []
            months_list = df['月'].tolist()
            print(f"PPI数据获取成功: {len(months_list)}条")
            return {
                'months': months_list,
                'yoy': yoy,
                'mom': mom,
                'lastUpdate': months_list[-1] if months_list else None
            }
    except Exception as e:
        print(f"PPI数据获取失败: {e}")
    return None


def fetch_pmi_data():
    """获取PMI数据"""
    try:
        if AKSHARE_AVAILABLE:
            df = ak.macro_china_pmi()
            df = df.sort_values('月份')
            df = df[df['月份'] >= '2024-01']
            df = df[df['月份'] <= '2026-03']
            pmi_values = df['制造业-指数'].tolist() if '制造业-指数' in df.columns else []
            months_list = df['月份'].tolist()
            print(f"PMI数据获取成功: {len(months_list)}条")
            return {
                'months': months_list,
                'pmi': pmi_values,
                'lastUpdate': months_list[-1] if months_list else None
            }
    except Exception as e:
        print(f"PMI数据获取失败: {e}")
    return None


def fetch_fx_reserve():
    """获取外汇储备数据"""
    try:
        if AKSHARE_AVAILABLE:
            df = ak.macro_china_fx_reserves()
            df = df.sort_values('月份')
            df = df[df['月份'] >= '2024-01']
            values = df['国家外汇储备（亿美元）'].tolist() if '国家外汇储备（亿美元）' in df.columns else []
            months_list = df['月份'].tolist()
            print(f"外汇储备数据获取成功: {len(months_list)}条")
            return {
                'months': months_list,
                'amount': values,
                'lastUpdate': months_list[-1] if months_list else None
            }
    except Exception as e:
        print(f"外汇储备数据获取失败: {e}")
    return None


def fetch_money_supply():
    """获取货币供应量数据"""
    try:
        if AKSHARE_AVAILABLE:
            df = ak.macro_china_money_supply()
            df = df.sort_values('月份')
            df = df[df['月份'] >= '2024-01']
            m0 = df['M0-同比增长'].tolist() if 'M0-同比增长' in df.columns else []
            m1 = df['M1-同比增长'].tolist() if 'M1-同比增长' in df.columns else []
            m2 = df['M2-同比增长'].tolist() if 'M2-同比增长' in df.columns else []
            months_list = df['月份'].tolist()
            print(f"货币供应量数据获取成功: {len(months_list)}条")
            return {
                'months': months_list,
                'm0': m0,
                'm1': m1,
                'm2': m2,
                'lastUpdate': months_list[-1] if months_list else None
            }
    except Exception as e:
        print(f"货币供应量数据获取失败: {e}")
    return None


def fetch_gdp():
    """获取GDP数据"""
    try:
        if AKSHARE_AVAILABLE:
            df = ak.macro_china_gdp()
            df = df.sort_values('季度')
            df = df[df['季度'] >= '2024']
            quarters = df['季度'].tolist()
            values = df['国内生产总值-绝对值'].tolist() if '国内生产总值-绝对值' in df.columns else []
            yoy = df['国内生产总值-同比增长'].tolist() if '国内生产总值-同比增长' in df.columns else []
            print(f"GDP数据获取成功: {len(quarters)}条")
            return {
                'quarters': quarters,
                'values': values,
                'yoy': yoy,
                'lastUpdate': quarters[-1] if quarters else None
            }
    except Exception as e:
        print(f"GDP数据获取失败: {e}")
    return None


def fetch_industrial_production():
    """获取工业增加值数据"""
    try:
        if AKSHARE_AVAILABLE:
            df = ak.macro_china_industrial_production()
            df = df.sort_values('月份')
            df = df[df['月份'] >= '2024-01']
            values = df['同比增长'].tolist() if '同比增长' in df.columns else []
            months_list = df['月份'].tolist()
            print(f"工业增加值数据获取成功: {len(months_list)}条")
            return {
                'months': months_list,
                'yoy': values,
                'lastUpdate': months_list[-1] if months_list else None
            }
    except Exception as e:
        print(f"工业增加值数据获取失败: {e}")
    return None


def fetch_retail_sales():
    """获取社会消费品零售总额数据"""
    try:
        if AKSHARE_AVAILABLE:
            df = ak.macro_china_retail_sales()
            df = df.sort_values('月份')
            df = df[df['月份'] >= '2024-01']
            values = df['同比增长'].tolist() if '同比增长' in df.columns else []
            months_list = df['月份'].tolist()
            print(f"社零数据获取成功: {len(months_list)}条")
            return {
                'months': months_list,
                'yoy': values,
                'lastUpdate': months_list[-1] if months_list else None
            }
    except Exception as e:
        print(f"社零数据获取失败: {e}")
    return None


def fetch_unemployment():
    """获取城镇调查失业率数据"""
    try:
        if AKSHARE_AVAILABLE:
            df = ak.macro_china_urban_unemployment()
            df = df.sort_values('月份')
            df = df[df['月份'] >= '2024-01']
            values = df['全国城镇调查失业率'].tolist() if '全国城镇调查失业率' in df.columns else []
            months_list = df['月份'].tolist()
            print(f"失业率数据获取成功: {len(months_list)}条")
            return {
                'months': months_list,
                'rate': values,
                'lastUpdate': months_list[-1] if months_list else None
            }
    except Exception as e:
        print(f"失业率数据获取失败: {e}")
    return None


def fetch_lpr():
    """获取LPR数据"""
    try:
        if AKSHARE_AVAILABLE:
            df = ak.macro_china_lpr()
            df = df.sort_values('日期')
            df = df[df['日期'] >= '2024-01-01']
            lpr_1y = df['LPR_1Y'].tolist() if 'LPR_1Y' in df.columns else []
            lpr_5y = df['LPR_5Y'].tolist() if 'LPR_5Y' in df.columns else []
            dates = df['日期'].tolist()
            print(f"LPR数据获取成功: {len(dates)}条")
            return {
                'dates': dates,
                'lpr1y': lpr_1y,
                'lpr5y': lpr_5y,
                'lastUpdate': dates[-1] if dates else None
            }
    except Exception as e:
        print(f"LPR数据获取失败: {e}")
    return None


def fetch_all_data():
    """获取所有宏观经济数据"""
    print(f"开始获取宏观经济数据... {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    all_data = {
        'fetchTime': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'dataSource': 'AkShare (国家统计局等)',
    }
    
    # CPI
    cpi = fetch_cpi_data()
    if cpi:
        all_data['cpi'] = cpi
    
    # PPI
    ppi = fetch_ppi_data()
    if ppi:
        all_data['ppi'] = ppi
    
    # PMI
    pmi = fetch_pmi_data()
    if pmi:
        all_data['pmi'] = pmi
    
    # 外汇储备
    fx = fetch_fx_reserve()
    if fx:
        all_data['fxReserve'] = fx
    
    # 货币供应量
    money = fetch_money_supply()
    if money:
        all_data['moneySupply'] = money
    
    # GDP
    gdp = fetch_gdp()
    if gdp:
        all_data['gdp'] = gdp
    
    # 工业增加值
    industrial = fetch_industrial_production()
    if industrial:
        all_data['industrial'] = industrial
    
    # 社零
    retail = fetch_retail_sales()
    if retail:
        all_data['retail'] = retail
    
    # 失业率
    unemployment = fetch_unemployment()
    if unemployment:
        all_data['unemployment'] = unemployment
    
    # LPR
    lpr = fetch_lpr()
    if lpr:
        all_data['lpr'] = lpr
    
    return all_data


def main():
    """主函数"""
    print("=" * 50)
    print("宏观经济数据自动更新脚本")
    print("=" * 50)
    
    # 获取数据
    data = fetch_all_data()
    
    # 保存为JSON文件
    output_file = os.path.join(OUTPUT_DIR, 'macro_data.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n数据已保存至: {output_file}")
    print(f"包含数据项: {list(data.keys())}")
    
    # 生成最后更新时间戳
    timestamp_file = os.path.join(OUTPUT_DIR, 'last_update.txt')
    with open(timestamp_file, 'w') as f:
        f.write(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    
    print(f"更新时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    return data


if __name__ == '__main__':
    main()
