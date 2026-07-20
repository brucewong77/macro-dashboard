#!/usr/bin/env python3
"""宏观经济数据爬取脚本 — 通过 Wind MCP CLI 获取数据"""
import json, os, subprocess, sys, time
from datetime import datetime

SKILL_DIR = os.path.expanduser("~/.agents/skills/wind-mcp-skill")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
os.makedirs(OUTPUT_DIR, exist_ok=True)
CLI = ["node", "scripts/cli.mjs", "call", "economic_data", "get_economic_data"]


def call_wind(metric, freq="月", start="20100101", end="20260630", max_retries=5):
    """调用 Wind CLI 获取数据，带自动重试（应对限流/配额不足）"""
    params = json.dumps({"metricIdsStr": metric, "freq": freq,
                         "beginDate": start, "endDate": end}, ensure_ascii=False)

    for attempt in range(max_retries):
        try:
            r = subprocess.run(CLI + [params], capture_output=True, text=True,
                               cwd=SKILL_DIR, timeout=60)
            raw = json.loads(r.stdout)

            # 无内容 → 配额/限流错误，重试
            if "content" not in raw:
                err_code = raw.get("error", {}).get("code", "")
                if attempt < max_retries - 1:
                    wait = (attempt + 1) * 3
                    print(f"    ⏳ {metric} ({err_code}), {wait}s后重试({attempt+2}/{max_retries})...")
                    time.sleep(wait)
                    continue
                return [], []

            text = raw["content"][0]["text"]
            parsed = json.loads(text)

            if parsed.get("error"):
                err_code = parsed["error"].get("code", "")
                if attempt < max_retries - 1:
                    wait = (attempt + 1) * 3
                    print(f"    ⏳ {metric} ({err_code}), {wait}s后重试({attempt+2}/{max_retries})...")
                    time.sleep(wait)
                    continue
                return [], []

            data = parsed["data"]
            dates = [d[:4] + "-" + d[4:6] for d in data["date"]]
            infos = data.get("indicatorInfo", [])
            if not infos:
                return dates, [None] * len(dates)

            # 精确名称匹配
            exact = next((info for info in infos if info.get("name", "").strip() == metric), None)
            if exact:
                return dates, exact["data"]

            # 没精确匹配则取有效值最多的
            best = max(infos, key=lambda x: sum(1 for v in x["data"] if v is not None))
            return dates, best["data"]

        except Exception as e:
            if attempt < max_retries - 1:
                wait = (attempt + 1) * 2
                print(f"    ⏳ {metric} 异常, {wait}s后重试({attempt+2}/{max_retries})...")
                time.sleep(wait)
                continue
            print(f"    ⚠️ {metric} 放弃: {e}")
            return [], []

    return [], []


def fetch_all():
    print(f"📡 从 Wind 获取宏观经济数据... {datetime.now()}")
    out = {"fetchTime": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
           "dataSource": "Wind"}

    # CPI
    print("  CPI...")
    d, y = call_wind("中国:CPI:当月同比")
    dm, m = call_wind("中国:CPI:环比", start="20240101")
    if d:
        out["cpi"] = {"months": d, "yoy": y, "mom": m, "momMonths": dm, "lastUpdate": d[-1]}
        print(f"    ✓ {len(d)}条, yoy={y[-1]}")

    # PPI
    print("  PPI...")
    d, y = call_wind("中国:PPI:当月同比")
    dm, m = call_wind("中国:PPI:环比", start="20240101")
    if d:
        out["ppi"] = {"months": d, "yoy": y, "mom": m, "momMonths": dm, "lastUpdate": d[-1]}
        print(f"    ✓ {len(d)}条, yoy={y[-1] if y else 'N/A'}")

    # PMI
    print("  PMI...")
    d, v = call_wind("中国:制造业PMI")
    if d:
        out["pmi"] = {"months": d, "pmi": v, "lastUpdate": d[-1]}
        print(f"    ✓ {len(d)}条, pmi={v[-1] if v else 'N/A'}")

    # 进出口
    print("  进出口...")
    ed, ey = call_wind("中国:出口金额:当月同比")
    imd, imy = call_wind("中国:进口金额:当月同比")
    if ed and imd:
        n = min(len(ed), len(imd))
        out["trade"] = {"months": ed[:n], "exportYoy": ey[:n],
                        "importYoy": imy[:n], "lastUpdate": ed[-1]}
        print(f"    ✓ {n}条, export={ey[-1]}, import={imy[-1]}")

    # 工业增加值
    print("  工业增加值...")
    d, y = call_wind("中国:工业增加值:规模以上工业企业:当月同比(1-2月拆分)")
    if d:
        # Wind dates are "2010-01-01" format, strip to "2010-01"
        out["industrial"] = {"dates": [x[:7] for x in d],
                             "yoy": y, "lastUpdate": d[-1][:-3] if d else None}
        print(f"    ✓ {len(d)}条, yoy={y[-1]}")

    # 社零
    print("  社零...")
    d, y = call_wind("中国:社会消费品零售总额:当月同比(1-2月合并)")
    if d:
        out["retail"] = {"months": d, "yoy": y, "lastUpdate": d[-1]}
        print(f"    ✓ {len(d)}条, yoy={y[-1]}")

    # 固投
    print("  固定资产投资...")
    d, y = call_wind("中国:固定资产投资完成额:累计同比")
    if d:
        out["fai"] = {"months": d, "accumYoy": y, "lastUpdate": d[-1]}
        print(f"    ✓ {len(d)}条, accumYoy={y[-1]}")

    # 货币供应
    print("  货币供应...")
    md, m2 = call_wind("中国:M2:同比")
    _, m1 = call_wind("中国:M1:同比")
    _, m0 = call_wind("中国:M0:同比")
    if md:
        out["moneySupply"] = {"months": md, "m0": m0, "m1": m1,
                              "m2": m2, "lastUpdate": md[-1]}
        print(f"    ✓ {len(md)}条, M2={m2[-1] if m2 else 'N/A'}")

    # 用电量
    print("  用电量...")
    d, y = call_wind("中国:全社会用电量:当月同比")
    if d:
        out["electricity"] = {"months": d, "yoy": y, "lastUpdate": d[-1]}
        print(f"    ✓ {len(d)}条, yoy={y[-1] if y else 'N/A'}")

    # 失业率
    print("  失业率...")
    d, r = call_wind("中国:城镇调查失业率", start="20180101")
    if d:
        out["unemployment"] = {"months": d, "rate": r, "lastUpdate": d[-1]}
        print(f"    ✓ {len(d)}条, rate={r[-1] if r else 'N/A'}")

    # GDP
    print("  GDP...")
    gd, gy = call_wind("中国:GDP:不变价:当季同比", freq="季")
    if gd:
        qs = []
        for q in gd:
            y, m = q[:4], q[4:6]
            qt = (int(m) - 1) // 3 + 1
            qs.append(f"{y}年第{qt}季度")
        out["gdp"] = {"quarters": qs, "yoy": gy, "lastUpdate": qs[-1]}
        print(f"    ✓ {len(qs)}条, yoy={gy[-1] if gy else 'N/A'}")

    print(f"\n✅ 完成, 获取了 {len(out)-2} 个指标")
    return out


def main():
    if not os.path.isdir(SKILL_DIR):
        print(f"❌ Wind skill 目录不存在: {SKILL_DIR}")
        sys.exit(1)
    data = fetch_all()
    fp = os.path.join(OUTPUT_DIR, 'macro_data.json')
    with open(fp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"💾 保存到: {fp}")
    print(f"📊 数据源: Wind")

    # 上报缺失指标
    expected = ['cpi', 'ppi', 'pmi', 'trade', 'industrial', 'retail',
                'fai', 'moneySupply', 'electricity', 'unemployment', 'gdp']
    missing = [k for k in expected if k not in data]
    if missing:
        print(f"⚠️ 缺失指标: {missing}（配额不足，下次运行会自动补全）")


if __name__ == '__main__':
    main()
