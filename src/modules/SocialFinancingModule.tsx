import { useMemo, useState } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';
import { WindIdHover } from '../components/WindIdHover';
import sfRaw from '../data/sfExcelData.json';

const sfData = sfRaw as {
  dates: string[];
  columns: Record<string, { name: string; col: number; data: Record<string, number> }>;
};

const g = (id: string) => sfData.columns[id]?.data ?? {};

function recent13(): string[] {
  const all = Object.keys(g('M5206730')).sort();
  return all.slice(-13).reverse();
}

function getHeatBg(v: number): string {
  if (v === 0) return '#e2e8f0';
  if (v > 0) { const t = Math.min(v / 3000, 1); if (t < 0.1) return '#fef2f2'; if (t < 0.2) return '#fee2e2'; if (t < 0.35) return '#fecaca'; if (t < 0.5) return '#fca5a5'; if (t < 0.7) return '#f87171'; if (t < 0.85) return '#ef4444'; return '#b91c1c'; }
  const t = Math.min(Math.abs(v) / 3000, 1); if (t < 0.1) return '#f0fdf4'; if (t < 0.2) return '#dcfce7'; if (t < 0.35) return '#bbf7d0'; if (t < 0.5) return '#86efac'; if (t < 0.7) return '#4ade80'; if (t < 0.85) return '#22c55e'; return '#15803d';
}
function getHeatText(v: number): string { return Math.abs(v) > 2000 ? '#fff' : '#1f2937'; }

type TableRow = { name: string; windId: string; values: (number | null)[]; prevValues?: (number | null)[] };

function yearLines(id: string, unit: string) {
  const d = g(id);
  if (!d) return null;
  const years = [2026, 2025, 2024, 2023, 2022, 2021];
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#94a3b8'];
  const xAxisData = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
  const series = years.map((y, i) => ({
    name: `${y}年`, type: 'line' as const,
    data: Array.from({ length: 12 }, (_, m) => d[`${y}-${String(m + 1).padStart(2, '0')}`] ?? null),
    connectNulls: false, smooth: true,
    lineStyle: { color: colors[i], width: 2 }, itemStyle: { color: colors[i] }, symbol: 'circle', symbolSize: 3,
  }));
  return {
    tooltip: { trigger: 'axis' as const },
    legend: { data: years.map(y => `${y}年`), bottom: 0, textStyle: { color: '#64748b', fontSize: 9 } },
    grid: { top: 10, right: 15, bottom: 40, left: 55 },
    xAxis: { type: 'category' as const, data: xAxisData, axisLabel: { color: '#64748b', fontSize: 9 } },
    yAxis: { type: 'value' as const, name: unit, nameTextStyle: { fontSize: 9 }, axisLabel: { fontSize: 9, formatter: (v: number) => v >= 10000 ? (v / 10000).toFixed(0) + '万' : v.toString() }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
    series,
  };
}

/** 累计折线图：当月值累加 */
function yearCumLines(id: string, unit: string) {
  const d = g(id);
  if (!d) return null;
  const years = [2026, 2025, 2024, 2023, 2022, 2021];
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#94a3b8'];
  const xAxisData = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
  const series = years.map((y, i) => {
    let cum = 0;
    const data: (number | null)[] = [];
    for (let m = 1; m <= 12; m++) {
      const v = d[`${y}-${String(m).padStart(2, '0')}`];
      if (v != null) { cum += v; data.push(cum); }
      else { data.push(null); }
    }
    return {
      name: `${y}年`, type: 'line' as const, data,
      connectNulls: false, smooth: true,
      lineStyle: { color: colors[i], width: 2 }, itemStyle: { color: colors[i] }, symbol: 'circle', symbolSize: 3,
    };
  });
  return {
    tooltip: { trigger: 'axis' as const },
    legend: { data: years.map(y => `${y}年`), bottom: 0, textStyle: { color: '#64748b', fontSize: 9 } },
    grid: { top: 10, right: 15, bottom: 40, left: 55 },
    xAxis: { type: 'category' as const, data: xAxisData, axisLabel: { color: '#64748b', fontSize: 9 } },
    yAxis: { type: 'value' as const, name: unit, nameTextStyle: { fontSize: 9 }, axisLabel: { fontSize: 9, formatter: (v: number) => v >= 10000 ? (v / 10000).toFixed(0) + '万' : v.toString() }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
    series,
  };
}

export function SocialFinancingModule() {
  const rec12 = recent13();

  // Part 1: 社融增量柱状图 + 同比变化
  const dr1 = useChartDateRange(2021, 1);
  const m1 = useMemo(() => Object.keys(g('M5206730')).filter(m => m >= dr1.startStr && m <= dr1.endStr).sort(), [dr1]);
  const incData = useMemo(() => m1.map(m => g('M5206730')[m] ?? null), [m1]);
  const incYoyData = useMemo(() => m1.map(m => {
    const cur = g('M5206730')[m] ?? 0;
    const [y, mon] = m.split('-');
    const prev = g('M5206730')[`${Number(y) - 1}-${mon}`] ?? 0;
    return cur - prev;
  }), [m1]);

  // Part 2: 存量折线
  const dr2 = useChartDateRange(2018, 1);
  const m2 = useMemo(() => Object.keys(g('M5525763')).filter(m => m >= dr2.startStr && m <= dr2.endStr).sort(), [dr2]);
  const stockData = useMemo(() => m2.map(m => g('M5525763')[m] ?? null), [m2]);

  // Part 3: 分项表格
  const [fxySort, setFxySort] = useState<string | null>(null);
  const [fxyDir, setFxyDir] = useState<'asc' | 'desc'>('desc');
  const fxyItems = [
    ['新增人民币贷款', 'M5206731'], ['企业债券融资', 'M5206736'], ['政府债券', 'M6179492'],
    ['新增外币贷款', 'M5206732'], ['新增委托贷款', 'M5206733'], ['新增信托贷款', 'M5206734'],
    ['新增未贴现银行承兑汇票', 'M5206735'], ['非金融企业股票融资', 'M5206737'],
  ];
  const fxyRows = useMemo(() => {
    const rows = fxyItems.map(([name, wid]) => ({
      name, windId: wid,
      values: rec12.map(m => g(wid)[m] ?? null),
    }));
    // Add prev-month values for color comparison, including latest month vs month before rec12 range
    const allMonths = Object.keys(g('M5206730')).sort();
    rows.forEach(row => {
      (row as any).prevValues = rec12.map((m, i) => {
        if (i === 0) {
          // Latest month: compare with month before rec12 range
          const idx = allMonths.indexOf(m);
          return idx > 0 ? g(row.windId)[allMonths[idx - 1]] ?? null : null;
        }
        return row.values[i - 1];
      });
    });
    if (!fxySort) return rows;
    const idx = rec12.indexOf(fxySort);
    if (idx < 0) return rows;
    return [...rows].sort((a, b) => {
      const va = a.values[idx] ?? -9999, vb = b.values[idx] ?? -9999;
      return fxyDir === 'desc' ? vb - va : va - vb;
    });
  }, [rec12, fxySort, fxyDir]);

  // Part 4 & 5: 历年贷款
  const resLong = useMemo(() => yearLines('M0057875', '亿元'), []);
  const resShort = useMemo(() => yearLines('M0057874', '亿元'), []);
  const corpLong = useMemo(() => yearLines('M0057877', '亿元'), []);
  const corpShort = useMemo(() => yearLines('M0057876', '亿元'), []);

  // Part 6: 累计值（新增）
  const cumTotal = useMemo(() => yearCumLines('M0009973', '亿元'), []);
  const cumResident = useMemo(() => yearCumLines('M0009976', '亿元'), []);
  const cumResidentLong = useMemo(() => yearCumLines('M0057875', '亿元'), []);
  const cumCorp = useMemo(() => yearCumLines('M0009977', '亿元'), []);
  const cumShortBill = useMemo(() => yearCumLines('M0009974', '亿元'), []);
  const cumStock = useMemo(() => yearCumLines('M5206737', '亿元'), []);

  return (
    <div className="space-y-4">
      {/* Part 1: 社融增量 */}
      <ChartCard title={<WindIdHover id="M5206730">社会融资规模当月新增及同比变化</WindIdHover>} subtitle={`${dr1.startStr} ~ ${dr1.endStr} | 数据来源：中国人民银行`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          legend: { data: ['当月新增', '同比变化'], top: 5, textStyle: { color: '#64748b', fontSize: 11 }, icon: 'circle', itemWidth: 8, itemHeight: 8 },
          grid: { top: 40, right: 20, bottom: 30, left: 55 },
          xAxis: { type: 'category', data: m1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '亿元', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10, formatter: (v: number) => (v / 10000).toFixed(1) + '万' }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: [
            { name: '当月新增', type: 'bar', data: incData, barWidth: '50%', itemStyle: { color: (p: any) => (p.value ?? 0) >= 0 ? '#06b6d4' : '#ef4444', borderRadius: [3, 3, 0, 0] }, yAxisIndex: 0 },
            { name: '同比变化', type: 'line', data: incYoyData, smooth: true, lineStyle: { color: '#f59e0b', width: 2 }, itemStyle: { color: '#f59e0b' }, symbol: 'circle', symbolSize: 4, yAxisIndex: 0 },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      {/* Part 2: 存量折线 */}
      <ChartCard title={<WindIdHover id="M5525763">社会融资规模存量同比变化</WindIdHover>} subtitle={`${dr2.startStr} ~ ${dr2.endStr} | 数据来源：中国人民银行`} dateRange={dr2}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: m2, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: [{ type: 'line', data: stockData, connectNulls: true, smooth: true, lineStyle: { color: '#06b6d4', width: 2 }, itemStyle: { color: '#06b6d4' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(6,182,212,0.12)' }, { offset: 1, color: 'rgba(6,182,212,0)' }] } }, symbol: 'circle', symbolSize: 3 }],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      {/* Part 3: 分项表格 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#f1f5f9] flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-[#1e293b]">社会融资主要分项当月值（近13个月，最新月靠左）</h3>
          <select className="border border-[#e2e8f0] rounded text-[10px] px-1 py-0.5 text-[#64748b]" value={fxySort || ''}
            onChange={e => { const v = e.target.value || null; if (v === fxySort) setFxyDir(d => d === 'asc' ? 'desc' : 'asc'); else { setFxySort(v); setFxyDir('desc'); } }}>
            <option value="">默认排序</option>
            {rec12.map(m => <option key={m} value={m}>按{m}排序</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead><tr className="bg-[#f8fafc]">
              <th className="border border-[#e2e8f0] px-3 py-2 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]" style={{ minWidth: 150 }}>分项</th>
              {rec12.map(m => (
                <th key={m} className={`border border-[#e2e8f0] px-2 py-2 text-center font-semibold min-w-[56px] cursor-pointer hover:bg-[#e2e8f0] select-none ${fxySort === m ? 'text-[#2563eb] bg-blue-50' : 'text-[#475569]'}`}
                  onClick={() => { if (fxySort === m) setFxyDir(d => d === 'asc' ? 'desc' : 'asc'); else { setFxySort(m); setFxyDir('desc'); } }}>
                  <span className="text-[11px]">{m.slice(2)}</span><span className="text-[9px] ml-0.5">{fxySort === m ? (fxyDir === 'desc' ? '▼' : '▲') : ''}</span>
                </th>
              ))}
            </tr></thead>
            <tbody>
              {fxyRows.map((row, ri) => (
                <tr key={row.name} className={`group transition-colors hover:bg-blue-50/40 ${ri % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}`}>
                  <td className="sticky left-0 z-10 bg-inherit border-r-2 border-[#e2e8f0] px-3 py-1.5 text-[#334155] font-medium group-hover:bg-blue-50/40">
                    <span className="ml-2"><WindIdHover id={row.windId}>{row.name}</WindIdHover></span>
                  </td>
                  {row.values.map((v, ci) => {
                    const prev = (row as any).prevValues?.[ci] ?? null;
                    const bgColor = v != null && prev != null
                      ? (v > prev ? '#fee2e2' : v < prev ? '#dcfce7' : '')
                      : '';
                    return (
                      <td key={ci} className="border border-[#e2e8f0] px-2 py-1.5 text-center tabular-nums font-mono text-[11px]"
                        style={{ backgroundColor: bgColor }}>
                        {v != null ? (v >= 10000 ? (v / 10000).toFixed(1) + '万' : v.toFixed(0)) : '--'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Part 4: 居民贷款 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="px-4 py-2.5 border-b border-[#f1f5f9]">
          <h3 className="text-sm font-semibold text-[#1e293b]">历年居民贷款新增情况（亿元）</h3>
        </div>
        <div className="grid grid-cols-2 gap-0">
          <div className="border-r border-[#f1f5f9] p-3">
            <p className="text-xs text-[#64748b] mb-1 font-medium"><WindIdHover id="M0057875">居民中长贷</WindIdHover></p>
            {resLong && <ReactECharts option={resLong} style={{ height: 320 }} />}
          </div>
          <div className="p-3">
            <p className="text-xs text-[#64748b] mb-1 font-medium"><WindIdHover id="M0057874">居民短贷</WindIdHover></p>
            {resShort && <ReactECharts option={resShort} style={{ height: 320 }} />}
          </div>
        </div>
      </div>

      {/* Part 5: 企业贷款 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="px-4 py-2.5 border-b border-[#f1f5f9]">
          <h3 className="text-sm font-semibold text-[#1e293b]">历年企业贷款新增情况（亿元）</h3>
        </div>
        <div className="grid grid-cols-2 gap-0">
          <div className="border-r border-[#f1f5f9] p-3">
            <p className="text-xs text-[#64748b] mb-1 font-medium"><WindIdHover id="M0057877">企业中长贷</WindIdHover></p>
            {corpLong && <ReactECharts option={corpLong} style={{ height: 320 }} />}
          </div>
          <div className="p-3">
            <p className="text-xs text-[#64748b] mb-1 font-medium"><WindIdHover id="M0057876">企业短贷</WindIdHover></p>
            {corpShort && <ReactECharts option={corpShort} style={{ height: 320 }} />}
          </div>
        </div>
      </div>

      {/* Part 6: 历年新增人民币贷款累计值 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="px-4 py-2.5 border-b border-[#f1f5f9]">
          <h3 className="text-sm font-semibold text-[#1e293b]">历年新增人民币贷款累计值情况（亿元）</h3>
        </div>
        <div className="p-3 space-y-3">
          <ReactECharts option={cumTotal} style={{ height: 300 }} />
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f8fafc] rounded-lg p-3">
              <p className="text-xs text-[#64748b] mb-1 font-medium"><WindIdHover id="M0009976">居民新增贷款累计</WindIdHover></p>
              {cumResident && <ReactECharts option={cumResident} style={{ height: 280 }} />}
            </div>
            <div className="bg-[#f8fafc] rounded-lg p-3">
              <p className="text-xs text-[#64748b] mb-1 font-medium"><WindIdHover id="M0057875">居民中长期贷款累计</WindIdHover></p>
              {cumResidentLong && <ReactECharts option={cumResidentLong} style={{ height: 280 }} />}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f8fafc] rounded-lg p-3">
              <p className="text-xs text-[#64748b] mb-1 font-medium"><WindIdHover id="M0009977">企事业单位贷款累计</WindIdHover></p>
              {cumCorp && <ReactECharts option={cumCorp} style={{ height: 280 }} />}
            </div>
            <div className="bg-[#f8fafc] rounded-lg p-3">
              <p className="text-xs text-[#64748b] mb-1 font-medium"><WindIdHover id="M0009974">短期贷款及票据融资累计</WindIdHover></p>
              {cumShortBill && <ReactECharts option={cumShortBill} style={{ height: 280 }} />}
            </div>
          </div>
          <div className="bg-[#f8fafc] rounded-lg p-3">
            <p className="text-xs text-[#64748b] mb-1 font-medium"><WindIdHover id="M5206737">非金融企业境内股票融资累计</WindIdHover></p>
            {cumStock && <ReactECharts option={cumStock} style={{ height: 280 }} />}
          </div>
        </div>
      </div>

      <IndicatorExplanation title="社会融资规模指标说明" items={[
        { label: '指标定义', content: '社会融资规模增量指一定时期内实体经济从金融体系获得的资金总额，包括人民币贷款、外币贷款、委托贷款、信托贷款、未贴现银行承兑汇票、企业债券、政府债券、非金融企业股票融资等。' },
        { label: '数据来源', content: '中国人民银行（www.pbc.gov.cn），每月中旬公布。' },
        { label: '指标意义', content: '社融是实体经济的"晴雨表"，反映金融对实体经济的支持力度。居民中长贷反映购房需求，企业中长期贷款反映实体投资信心。' },
      ]} />
    </div>
  );
}

export default SocialFinancingModule;
