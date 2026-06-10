#!/usr/bin/env python3
"""宏观经济数据自动爬取脚本（适配 AkShare 1.18.60）"""
import json, os, re
from datetime import datetime

try:
    import akshare as ak
    AKSHARE_AVAILABLE = True
except ImportError:
    AKSHARE_AVAILABLE = False

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
os.makedirs(OUTPUT_DIR, exist_ok=True)

def clean_month(m):
    if not m: return m
    m = str(m).strip().replace('年', '-').replace('月份', '').replace('月', '')
    parts = m.split('-')
    if len(parts) == 2 and len(parts[1]) == 1: parts[1] = '0' + parts[1]
    return '-'.join(parts)

def col(df, name):
    if name in df.columns:
        vals = df[name].tolist()
        # 如果值是 datetime.date 等非 JSON 可序列化类型，转字符串
        for i, v in enumerate(vals):
            if hasattr(v, 'isoformat'):
                vals[i] = v.isoformat()
            elif not isinstance(v, (int, float, str, bool, type(None))):
                vals[i] = str(v)
        return vals
    print(f"  列 '{name}' 不存在, 可用: {list(df.columns)}"); return []

def to_num(v):
    try:
        x = float(v)
        if x != x:  # NaN check
            return None
        return x
    except: return None

def fetch_cpi():
    try:
        df = ak.macro_china_cpi().sort_values('月份')
        df = df[df['月份'] >= '2024-01']
        m = [clean_month(x) for x in col(df, '月份')]
        yoy = [to_num(v) for v in col(df, '全国-同比增长')]
        mom = [to_num(v) for v in col(df, '全国-环比增长')]
        if m: print(f"CPI: {len(m)}条, 最新{m[-1]}"); return {'months': m, 'yoy': yoy, 'mom': mom, 'lastUpdate': m[-1]}
    except Exception as e: print(f"CPI失败: {e}")
    return None

def fetch_ppi():
    try:
        df = ak.macro_china_ppi().sort_values('月份')
        m = [clean_month(x) for x in col(df, '月份')]
        yoy = [to_num(v) for v in col(df, '当月同比增长')]
        mom = [to_num(v) for v in col(df, '当月')]
        if m: print(f"PPI: {len(m)}条, 最新{m[-1]}"); return {'months': m, 'yoy': yoy, 'mom': mom, 'lastUpdate': m[-1]}
    except Exception as e: print(f"PPI失败: {e}")
    return None

def fetch_pmi():
    try:
        df = ak.macro_china_pmi().sort_values('月份')
        df = df[df['月份'] >= '2024-01']
        m = [clean_month(x) for x in col(df, '月份')]
        p = [to_num(v) for v in col(df, '制造业-指数')]
        if m: print(f"PMI: {len(m)}条, 最新{m[-1]}"); return {'months': m, 'pmi': p, 'lastUpdate': m[-1]}
    except Exception as e: print(f"PMI失败: {e}")
    return None

def fetch_fx():
    try:
        df = ak.macro_china_fx_reserves_yearly().sort_values('日期')
        d = col(df, '日期'); a = [to_num(v) for v in col(df, '今值')]
        if d: print(f"外汇: {len(d)}条, 最新{d[-1]}"); return {'dates': d, 'amount': a, 'lastUpdate': d[-1]}
    except Exception as e: print(f"外汇失败: {e}")
    return None

def fetch_money():
    try:
        df = ak.macro_china_money_supply().sort_values('月份')
        df = df[df['月份'] >= '2024-01']
        m = [clean_month(x) for x in col(df, '月份')]
        m0 = [to_num(v) for v in col(df, '流通中的现金(M0)-同比增长')]
        m1 = [to_num(v) for v in col(df, '货币(M1)-同比增长')]
        m2 = [to_num(v) for v in col(df, '货币和准货币(M2)-同比增长')]
        if m: print(f"货币: {len(m)}条, 最新{m[-1]}"); return {'months': m, 'm0': m0, 'm1': m1, 'm2': m2, 'lastUpdate': m[-1]}
    except Exception as e: print(f"货币失败: {e}")
    return None

def fetch_gdp():
    try:
        df = ak.macro_china_gdp().sort_values('季度')
        df = df[df['季度'] >= '2024']
        q = col(df, '季度'); v = [to_num(x) for x in col(df, '国内生产总值-绝对值')]; y = [to_num(x) for x in col(df, '国内生产总值-同比增长')]
        if q: print(f"GDP: {len(q)}条"); return {'quarters': q, 'values': v, 'yoy': y, 'lastUpdate': q[-1]}
    except Exception as e: print(f"GDP失败: {e}")
    return None

def fetch_industrial():
    try:
        df = ak.macro_china_industrial_production_yoy().sort_values('日期')
        d = col(df, '日期'); v = [to_num(x) for x in col(df, '今值')]
        if d: print(f"工业: {len(d)}条, 最新{d[-1]}"); return {'dates': d, 'yoy': v, 'lastUpdate': d[-1]}
    except Exception as e: print(f"工业失败: {e}")
    return None

def fetch_retail():
    try:
        df = ak.macro_china_consumer_goods_retail().sort_values('月份')
        df = df[df['月份'] >= '2024-01']
        m = [clean_month(x) for x in col(df, '月份')]; v = [to_num(x) for x in col(df, '同比增长')]
        if m: print(f"社零: {len(m)}条, 最新{m[-1]}"); return {'months': m, 'yoy': v, 'lastUpdate': m[-1]}
    except Exception as e: print(f"社零失败: {e}")
    return None

def fetch_unemp():
    try:
        df = ak.macro_china_urban_unemployment().sort_values('月份')
        df = df[df['月份'] >= '2024-01']
        m = [clean_month(x) for x in col(df, '月份')]; r = [to_num(x) for x in col(df, '全国城镇调查失业率')]
        if m: print(f"失业率: {len(m)}条, 最新{m[-1]}"); return {'months': m, 'rate': r, 'lastUpdate': m[-1]}
    except Exception as e: print(f"失业率失败: {e}")
    return None

def fetch_lpr():
    try:
        if not AKSHARE_AVAILABLE:
            return None
        df = ak.macro_china_lpr().sort_values('TRADE_DATE')
        dates, l1, l5 = [], [], []
        for _, row in df.iterrows():
            d = row['TRADE_DATE']
            ds = d.isoformat() if hasattr(d, 'isoformat') else str(d)
            if ds >= '2024-01-01':
                dates.append(ds)
                l1.append(to_num(row.get('LPR1Y')))
                l5.append(to_num(row.get('LPR5Y')))
        if dates:
            print(f"LPR获取成功: {len(dates)}条, 最新: {dates[-1]}")
            return {'dates': dates, 'lpr1y': l1, 'lpr5y': l5, 'lastUpdate': dates[-1]}
    except Exception as e:
        print(f"LPR获取失败: {e}")
    return None

def fetch_all_data():
    print(f"开始获取... {datetime.now()}")
    all_data = {'fetchTime': datetime.now().strftime('%Y-%m-%d %H:%M:%S'), 'dataSource': 'AkShare'}
    for name, fn in [('cpi', fetch_cpi), ('ppi', fetch_ppi), ('pmi', fetch_pmi), ('fxReserve', fetch_fx),
                      ('moneySupply', fetch_money), ('gdp', fetch_gdp), ('industrial', fetch_industrial),
                      ('retail', fetch_retail), ('unemployment', fetch_unemp), ('lpr', fetch_lpr)]:
        data = fn()
        if data: all_data[name] = data
    return all_data


def generate_analysis(data):
    """使用大模型API生成各指标点评"""
    api_key = os.environ.get('LLM_API_KEY', '')
    api_url = os.environ.get('LLM_API_URL', 'https://api.deepseek.com/v1/chat/completions')
    model = os.environ.get('LLM_MODEL', 'deepseek-chat')
    if not api_key:
        print("未配置LLM_API_KEY，跳过AI点评生成")
        return data

    indicators = {
        'cpi': 'CPI（居民消费价格指数）',
        'ppi': 'PPI（工业生产者出厂价格指数）',
        'pmi': '制造业PMI（采购经理指数）',
        'industrial': '规模以上工业增加值',
        'retail': '社会消费品零售总额',
        'unemployment': '城镇调查失业率',
        'fxReserve': '外汇储备',
        'moneySupply': '货币供应量(M2)',
        'gdp': 'GDP国内生产总值',
    }

    import urllib.request
    import json as json_mod

    for key, cname in indicators.items():
        if key not in data:
            continue
        d = data[key]
        print(f"正在为{cname}生成AI点评...")

        # 构造数据摘要
        if key == 'pmi':
            vals = d.get('pmi', [])
            months_list = d.get('months', [])
        elif key == 'gdp':
            vals = d.get('yoy', [])
            months_list = d.get('quarters', [])
        elif key == 'fxReserve':
            vals = d.get('amount', [])
            months_list = d.get('dates', [])
        elif key == 'moneySupply':
            vals = d.get('m2', [])
            months_list = d.get('months', [])
        else:
            vals = d.get('yoy', [])
            months_list = d.get('months', [])

        if not vals or not months_list:
            continue

        # 取最近6期数据
        recent = list(zip(months_list[-6:], vals[-6:]))
        data_str = '、'.join([f"{m}: {v}" for m, v in recent if v is not None])

        prompt = f"""你是一位宏观经济分析师。请对以下{cname}数据进行简要点评，控制在80字以内：
{data_str}
要求：用数据说话，指出趋势变化；只说确定的事实，不要预测；专业简洁。"""

        try:
            req_body = json_mod.dumps({
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 200,
                "temperature": 0.3,
            }).encode('utf-8')

            req = urllib.request.Request(api_url, data=req_body,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                },
                method='POST')

            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json_mod.loads(resp.read().decode('utf-8'))
                analysis = result['choices'][0]['message']['content'].strip()
                d['analysis'] = analysis
                print(f"  ✓ 点评生成成功: {analysis[:50]}...")
        except Exception as e:
            print(f"  ✗ 点评生成失败: {e}")

    return data


def main():
    data = fetch_all_data()
    data = generate_analysis(data)
    output_file = os.path.join(OUTPUT_DIR, 'macro_data.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"保存完成, 包含: {list(data.keys())}")

if __name__ == '__main__':
    main()
