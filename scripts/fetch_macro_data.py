#!/usr/bin/env python3
"""
宏观经济数据自动爬取脚本（兼容 AkShare 最新接口）
使用 AkShare 开源库从国家统计局、东方财富等数据源获取数据
"""
import json
import os
import sys
from datetime import datetime, timedelta

try:
    import akshare as ak
    AKSHARE_AVAILABLE = True
except ImportError:
    AKSHARE_AVAILABLE = False
    print("警告: akshare 未安装，将使用模拟数据模式")

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
os.makedirs(OUTPUT_DIR, exist_ok=True)


def safe_update(df, col):
    """安全获取列，不存在则返回空列表"""
    if col in df.columns:
        return df[col].tolist()
    print(f"  列 '{col}' 不存在，可用列: {list(df.columns)}")
    return []


def fetch_cpi_data():
    """获取CPI数据"""
    try:
        if AKSHARE_AVAILABLE:
            df = ak.macro_china_cpi_monthly()
            df = df.sort_values('月份')
            df = df[df['月份'] >= '2024-01']
            df = df[df['月份'] <= '2026-05']
            yoy = safe_update(df, '同比')
            mom = safe_update(df, '环比')
            months_list = safe_update(df, '月份')
            if months_list:
                print(f"CPI数据获取成功: {len(months_list)}条")
                return {
                    'months': months_list,
                    'yoy': yoy,
                    'mom': mom,
                    'lastUpdate': months_list[-1]
                }
    except Exception as e:
        print(f"CPI数据获取失败: {e}")
    return None


def fetch_ppi_data():
    """获取PPI数据"""
    try:
        if AKSHARE_AVAILABLE:
            df = ak.macro_china_ppi_monthly()
            df = df.sort_values('月份')
            df = df[df['月份'] >= '2024-01']
            df = df[df['月份'] <= '2026-05']
            yoy = safe_update(df, '同比')
            mom = safe_update(df, '环比')
            months_list = safe_update(df, '月份')
            if months_list:
                print(f"PPI数据获取成功: {len(months_list)}条")
                return {
                    'months': months_list,
                    'yoy': yoy,
                    'mom': mom,
                    'lastUpdate': months_list[-1]
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
            df = df[df['月份'] <= '2026-05']
            pmi_values = safe_update(df, '制造业-指数')
            months_list = safe_update(df, '月份')
            if months_list:
                print(f"PMI数据获取成功: {len(months_list)}条")
                return {
                    'months': months_list,
                    'pmi': pmi_values,
                    'lastUpdate': months_list[-1]
                }
    except Exception as e:
        print(f"PMI数据获取失败: {e}")
    return None


def fetch_fx_reserve():
    """获取外汇储备数据"""
    try:
        if AKSHARE_AVAILABLE:
            df = ak.macro_china_fx_reserves_monthly()
            df = df.sort_values('月份')
            df = df[df['月份'] >= '2024-01']
            values = safe_update(df, '外汇储备')
            months_list = safe_update(df, '月份')
            if months_list:
                print(f"外汇储备数据获取成功: {len(months_list)}条")
                return {
                    'months': months_list,
                    'amount': values,
                    'lastUpdate': months_list[-1]
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
            m0 = safe_update(df, 'M0-同比增长')
            m1 = safe_update(df, 'M1-同比增长')
            m2 = safe_update(df, 'M2-同比增长')
            months_list = safe_update(df, '月份')
            if months_list:
                print(f"货币供应量数据获取成功: {len(months_list)}条")
                return {
                    'months': months_list,
                    'm0': m0,
                    'm1': m1,
                    'm2': m2,
                    'lastUpdate': months_list[-1]
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
            quarters = safe_update(df, '季度')
            values = safe_update(df, '国内生产总值-绝对值')
            yoy = safe_update(df, '国内生产总值-同比增长')
            if quarters:
                print(f"GDP数据获取成功: {len(quarters)}条")
                return {
                    'quarters': quarters,
                    'values': values,
                    'yoy': yoy,
                    'lastUpdate': quarters[-1]
                }
    except Exception as e:
        print(f"GDP数据获取失败: {e}")
    return None


def fetch_industrial_production():
    """获取工业增加值数据"""
    try:
        if AKSHARE_AVAILABLE:
            df = ak.macro_china_industrial_production_yoy()
            df = df.sort_values('月份')
            df = df[df['月份'] >= '2024-01']
            values = safe_update(df, '同比增长')
            months_list = safe_update(df, '月份')
            if months_list:
                print(f"工业增加值数据获取成功: {len(months_list)}条")
                return {
                    'months': months_list,
                    'yoy': values,
                    'lastUpdate': months_list[-1]
                }
    except Exception as e:
        print(f"工业增加值数据获取失败: {e}")
    return None


def fetch_retail_sales():
    """获取社会消费品零售总额数据"""
    try:
        if AKSHARE_AVAILABLE:
            df = ak.macro_china_retail_sales_monthly()
            df = df.sort_values('月份')
            df = df[df['月份'] >= '2024-01']
            values = safe_update(df, '同比增长')
            months_list = safe_update(df, '月份')
            if months_list:
                print(f"社零数据获取成功: {len(months_list)}条")
                return {
                    'months': months_list,
                    'yoy': values,
                    'lastUpdate': months_list[-1]
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
            values = safe_update(df, '全国城镇调查失业率')
            months_list = safe_update(df, '月份')
            if months_list:
                print(f"失业率数据获取成功: {len(months_list)}条")
                return {
                    'months': months_list,
                    'rate': values,
                    'lastUpdate': months_list[-1]
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
            lpr_1y = safe_update(df, 'LPR1Y')
            lpr_5y = safe_update(df, 'LPR5Y')
            dates = safe_update(df, '日期')
            if dates:
                print(f"LPR数据获取成功: {len(dates)}条")
                return {
                    'dates': dates,
                    'lpr1y': lpr_1y,
                    'lpr5y': lpr_5y,
                    'lastUpdate': dates[-1]
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

    data = fetch_all_data()

    output_file = os.path.join(OUTPUT_DIR, 'macro_data.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n数据已保存至: {output_file}")
    print(f"包含数据项: {list(data.keys())}")

    timestamp_file = os.path.join(OUTPUT_DIR, 'last_update.txt')
    with open(timestamp_file, 'w') as f:
        f.write(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

    print(f"更新时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    return data


if __name__ == '__main__':
    main()
