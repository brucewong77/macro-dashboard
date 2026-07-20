import { useMemo, useState } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';
import { WindIdHover } from '../components/WindIdHover';
import reRaw from '../data/realEstateExcelData.json';

const reData = reRaw as {
  dates: string[];
  invest: Record<string, Record<string, number>>;
  build: Record<string, Record<string, number>>;
  sales: Record<string, Record<string, number>>;
  price: Record<string, Record<string, number>>;
  invest_ids: [string, string, string][];
  build_ids: [string, string, string][];
  sales_ids: [string, string, string][];
  price_ids: [string, string, string][];
};

function getHeatBg(v: number): string {
  if (v === 0) return '#e2e8f0';
  if (v > 0) {
    const t = Math.min(v / 15, 1);
    if (t < 0.1) return '#fef2f2'; if (t < 0.2) return '#fee2e2'; if (t < 0.35) return '#fecaca';
    if (t < 0.5) return '#fca5a5'; if (t < 0.7) return '#f87171';
    if (t < 0.85) return '#ef4444'; return '#b91c1c';
  }
  const t = Math.min(Math.abs(v) / 15, 1);
  if (t < 0.1) return '#f0fdf4'; if (t < 0.2) return '#dcfce7'; if (t < 0.35) return '#bbf7d0';
  if (t < 0.5) return '#86efac'; if (t < 0.7) return '#4ade80';
  if (t < 0.85) return '#22c55e'; return '#15803d';
}
function getHeatText(v: number): string { return Math.abs(v) > 10 ? '#fff' : '#1f2937'; }

function recent12(): string[] {
  const all = Object.keys(reData.invest?.total || {}).sort();
  return all.slice(-12).reverse();
}

function alignData(dataMap: Record<string, number>, months: string[]): (number | null)[] {
  return months.map(m => dataMap[m] ?? null);
}

type TableRow = { name: string; windId: string; values: (number | null)[]; isIndented?: boolean };

function sortRows(rows: TableRow[], col: string | null, dir: string, recMonths: string[]): TableRow[] {
  if (!col) return rows;
  const idx = recMonths.indexOf(col);
  if (idx < 0) return rows;
  return [...rows].sort((a, b) => {
    const va = a.values[idx] ?? -9999, vb = b.values[idx] ?? -9999;
    return dir === 'desc' ? vb - va : va - vb;
  });
}

function renderTable(
  title: string, rows: TableRow[], recMonths: string[],
  sortBy: string | null, setSortBy: (v: string | null) => void,
  sortDir: 'asc' | 'desc', setSortDir: (d: 'asc' | 'desc') => void,
) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#f1f5f9] flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-[#1e293b]">{title}（近12个月，最新月靠左）</h3>
        <select className="border border-[#e2e8f0] rounded text-[10px] px-1 py-0.5 text-[#64748b]" value={sortBy || ''}
          onChange={e => {
            const v = e.target.value || null;
            if (v === sortBy) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
            else { setSortBy(v); setSortDir('desc'); }
          }}>
          <option value="">默认排序</option>
          {recMonths.map(m => <option key={m} value={m}>按{m}排序</option>)}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead><tr className="bg-[#f8fafc]">
            <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">指标</th>
            {recMonths.map(m => (
              <th key={m} className={`border border-[#e2e8f0] px-1.5 py-1.5 text-center font-semibold min-w-[52px] cursor-pointer hover:bg-[#e2e8f0] select-none ${sortBy === m ? 'text-[#2563eb] bg-blue-50' : 'text-[#475569]'}`}
                onClick={() => { if (sortBy === m) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(m); setSortDir('desc'); } }}>
                {m.slice(2)} {(sortBy === m ? (sortDir === 'desc' ? '▼' : '▲') : '⇅')}
              </th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.name} className="group transition-colors hover:bg-blue-50/40">
                <td className="sticky left-0 z-10 bg-white border-r-2 border-[#cbd5e1] px-2 py-1.5 text-[#334155] font-medium group-hover:bg-blue-50/40">
                  {row.windId ? <WindIdHover id={row.windId}>{'isIndented' in row && row.isIndented ? '  ├ ' : ''}{row.name}</WindIdHover> : row.name}
                </td>
                {row.values.map((v, ci) => (
                  <td key={ci} className="border border-[#e2e8f0] px-1 py-1 text-center tabular-nums font-mono"
                    style={v != null ? { backgroundColor: getHeatBg(v), color: getHeatText(v) } : {}}>
                    {v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` : '--'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RealEstateModule() {
  const rec12 = useMemo(() => recent12(), []);

  // Part 1: 投资折线图
  const dr1 = useChartDateRange(2010, 1);
  const chartMonths = useMemo(() => {
    return Object.keys(reData.invest.total).filter(m => m >= dr1.startStr && m <= dr1.endStr).sort();
  }, [dr1]);
  const investTotal = useMemo(() => chartMonths.map(m => reData.invest.total[m] ?? null), [chartMonths]);
  const investResidential = useMemo(() => chartMonths.map(m => reData.invest.residential[m] ?? null), [chartMonths]);

  // Part 2a: 竣工折线图
  const dr2a = useChartDateRange(2010, 1);
  const chart2aMonths = useMemo(() => {
    return Object.keys(reData.build['竣工总面积'] || {}).filter(m => m >= dr2a.startStr && m <= dr2a.endStr).sort();
  }, [dr2a]);
  const completedTotal = useMemo(() => chart2aMonths.map(m => reData.build['竣工总面积']?.[m] ?? null), [chart2aMonths]);
  const completedResidential = useMemo(() => chart2aMonths.map(m => reData.build['竣工住宅']?.[m] ?? null), [chart2aMonths]);

  // Part 2b: 新开工折线图
  const dr2b = useChartDateRange(2010, 1);
  const chart2bMonths = useMemo(() => {
    return Object.keys(reData.build['新开工总面积'] || {}).filter(m => m >= dr2b.startStr && m <= dr2b.endStr).sort();
  }, [dr2b]);
  const newStartTotal = useMemo(() => chart2bMonths.map(m => reData.build['新开工总面积']?.[m] ?? null), [chart2bMonths]);
  const newStartOffice = useMemo(() => chart2bMonths.map(m => reData.build['新开工办公楼']?.[m] ?? null), [chart2bMonths]);
  const newStartResidential = useMemo(() => chart2bMonths.map(m => reData.build['新开工住宅']?.[m] ?? null), [chart2bMonths]);

  // Part 3: 销售表格
  const [salesSort, setSalesSort] = useState<string | null>(null);
  const [salesDir, setSalesDir] = useState<'asc' | 'desc'>('desc');
  const salesRows = useMemo(() =>
    sortRows(reData.sales_ids.map(([key, wid, name]) => ({
      name, windId: wid,
      values: alignData(reData.sales[key] || {}, rec12),
    })), salesSort, salesDir, rec12),
  [rec12, salesSort, salesDir]);

  // Part 4: 70城表格 - 分组显示，环比与同比同级
  const [priceSort, setPriceSort] = useState<string | null>(null);
  const [priceDir, setPriceDir] = useState<'asc' | 'desc'>('desc');
  const priceGroups = useMemo(() => {
    const priceMap = reData.price;
    // Build groups: [[header, rows], ...]
    const groups: { header: string; rows: TableRow[] }[] = [];

    // 新建住宅
    const newHomeRows: TableRow[] = [
      { name: '新建商品住宅当月同比', windId: 'S2707411', values: alignData(priceMap['新建住宅同比'] || {}, rec12) },
      { name: '新建住宅环比', windId: 'S2707412', values: alignData(priceMap['新建环比'] || {}, rec12) },
      { name: '一线城市', windId: 'S2707413', values: alignData(priceMap['一线新建同比'] || {}, rec12) },
      { name: '二线城市', windId: 'S2707414', values: alignData(priceMap['二线新建同比'] || {}, rec12) },
      { name: '三线城市', windId: 'S2707415', values: alignData(priceMap['三线新建同比'] || {}, rec12) },
    ];
    groups.push({ header: '新建商品住宅', rows: sortRows(newHomeRows, priceSort, priceDir, rec12) });

    // 二手住宅
    const usedRows: TableRow[] = [
      { name: '二手住宅当月同比', windId: 'S2707425', values: alignData(priceMap['二手住宅同比'] || {}, rec12) },
      { name: '二手住宅环比', windId: 'S2707426', values: alignData(priceMap['二手环比'] || {}, rec12) },
      { name: '一线城市', windId: 'S2707427', values: alignData(priceMap['一线二手同比'] || {}, rec12) },
      { name: '二线城市', windId: 'S2707428', values: alignData(priceMap['二线二手同比'] || {}, rec12) },
      { name: '三线城市', windId: 'S2707429', values: alignData(priceMap['三线二手同比'] || {}, rec12) },
    ];
    groups.push({ header: '二手住宅', rows: sortRows(usedRows, priceSort, priceDir, rec12) });

    return groups;
  }, [rec12, priceSort, priceDir]);

  return (
    <div className="space-y-4">
      {/* Part 1 */}
      <ChartCard title="房地产投资情况" subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.realestate}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          legend: { data: ['房地产开发累计同比', '住宅开发累计同比'], top: 5, textStyle: { color: '#64748b', fontSize: 11 }, icon: 'circle', itemWidth: 8, itemHeight: 8 },
          grid: { top: 40, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: chartMonths, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: [
            { name: '房地产开发累计同比', type: 'line', data: investTotal, connectNulls: true, smooth: true, lineStyle: { color: '#ef4444', width: 2 }, itemStyle: { color: '#ef4444' }, symbol: 'circle', symbolSize: 3 },
            { name: '住宅开发累计同比', type: 'line', data: investResidential, connectNulls: true, smooth: true, lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' }, symbol: 'circle', symbolSize: 3 },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>
      <div className="text-[10px] text-[#94a3b8] -mt-3 ml-1">开发投资 <WindIdHover id="S0029657">S0029657</WindIdHover> | 住宅投资 <WindIdHover id="S0049576">S0049576</WindIdHover></div>

      {/* Part 2a: 竣工面积 */}
      <ChartCard title="房屋竣工面积累计同比" subtitle={`${dr2a.startStr} ~ ${dr2a.endStr} | ${DATA_SOURCES.realestate}`} dateRange={dr2a}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          legend: { data: ['竣工总面积', '竣工住宅'], top: 5, textStyle: { color: '#64748b', fontSize: 11 }, icon: 'circle', itemWidth: 8, itemHeight: 8 },
          grid: { top: 40, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: chart2aMonths, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: [
            { name: '竣工总面积', type: 'line', data: completedTotal, connectNulls: true, smooth: true, lineStyle: { color: '#10b981', width: 2 }, itemStyle: { color: '#10b981' }, symbol: 'circle', symbolSize: 3 },
            { name: '竣工住宅', type: 'line', data: completedResidential, connectNulls: true, smooth: true, lineStyle: { color: '#f59e0b', width: 2 }, itemStyle: { color: '#f59e0b' }, symbol: 'circle', symbolSize: 3 },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>
      <div className="text-[10px] text-[#94a3b8] -mt-3 ml-1">竣工总面积 <WindIdHover id="S0073297">S0073297</WindIdHover> | 竣工住宅 <WindIdHover id="S0073307">S0073307</WindIdHover></div>

      {/* Part 2b: 新开工面积 */}
      <ChartCard title="房屋新开工面积累计同比" subtitle={`${dr2b.startStr} ~ ${dr2b.endStr} | ${DATA_SOURCES.realestate}`} dateRange={dr2b}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          legend: { data: ['新开工总面积', '新开工办公楼', '新开工住宅'], top: 5, textStyle: { color: '#64748b', fontSize: 11 }, icon: 'circle', itemWidth: 8, itemHeight: 8 },
          grid: { top: 40, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: chart2bMonths, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: [
            { name: '新开工总面积', type: 'line', data: newStartTotal, connectNulls: true, smooth: true, lineStyle: { color: '#ef4444', width: 2 }, itemStyle: { color: '#ef4444' }, symbol: 'circle', symbolSize: 3 },
            { name: '新开工办公楼', type: 'line', data: newStartOffice, connectNulls: true, smooth: true, lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' }, symbol: 'circle', symbolSize: 3 },
            { name: '新开工住宅', type: 'line', data: newStartResidential, connectNulls: true, smooth: true, lineStyle: { color: '#8b5cf6', width: 2 }, itemStyle: { color: '#8b5cf6' }, symbol: 'circle', symbolSize: 3 },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>
      <div className="text-[10px] text-[#94a3b8] -mt-3 ml-1">新开工总面积 <WindIdHover id="S0073293">S0073293</WindIdHover> | 新开工办公楼 <WindIdHover id="S0073295">S0073295</WindIdHover> | 新开工住宅 <WindIdHover id="S0073294">S0073294</WindIdHover></div>

      {/* Part 3: 销售表格 - 分组显示 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#f1f5f9] flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-[#1e293b]">房地产销售情况（近12个月，最新月靠左）</h3>
          <select className="border border-[#e2e8f0] rounded text-[10px] px-1 py-0.5 text-[#64748b]" value={salesSort || ''}
            onChange={e => {
              const v = e.target.value || null;
              if (v === salesSort) setSalesDir(d => d === 'asc' ? 'desc' : 'asc');
              else { setSalesSort(v); setSalesDir('desc'); }
            }}>
            <option value="">默认排序</option>
            {rec12.map(m => <option key={m} value={m}>按{m}排序</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc]">
                <th className="border border-[#e2e8f0] px-3 py-2 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]" style={{ minWidth: 160 }}>指标</th>
                {rec12.map(m => (
                  <th key={m} className={`border border-[#e2e8f0] px-2 py-2 text-center font-semibold min-w-[54px] cursor-pointer hover:bg-[#e2e8f0] select-none ${salesSort === m ? 'text-[#2563eb] bg-blue-50' : 'text-[#475569]'}`}
                    onClick={() => { if (salesSort === m) setSalesDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSalesSort(m); setSalesDir('desc'); } }}>
                    <span className="text-[11px]">{m.slice(2)}</span>
                    <span className="text-[9px] ml-0.5">{salesSort === m ? (salesDir === 'desc' ? '▼' : '▲') : ''}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const salesGroups = [
                  { header: '商品房销售额累计同比', rows: salesRows.filter(r => r.name.includes('销售额')) },
                  { header: '商品房销售面积累计同比', rows: salesRows.filter(r => r.name.includes('销售面积')) },
                ];
                return salesGroups.map(grp => (
                  <>
                    <tr key={grp.header} className="bg-[#f0f4ff]">
                      <td colSpan={rec12.length + 1} className="border border-[#e2e8f0] px-3 py-1.5 text-xs font-bold text-[#1e40af]">
                        {grp.header}
                      </td>
                    </tr>
                    {grp.rows.map((row, ri) => (
                      <tr key={row.name} className={`group transition-colors hover:bg-blue-50/40 ${ri % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}`}>
                        <td className="sticky left-0 z-10 bg-inherit border-r-2 border-[#e2e8f0] px-3 py-1.5 text-[#334155] font-medium group-hover:bg-blue-50/40">
                          <span className="ml-3">{row.windId ? <WindIdHover id={row.windId}>{row.name}</WindIdHover> : row.name}</span>
                        </td>
                        {row.values.map((v, ci) => (
                          <td key={ci} className="border border-[#e2e8f0] px-2 py-1.5 text-center tabular-nums font-mono text-[11px]"
                            style={v != null ? { backgroundColor: getHeatBg(v), color: getHeatText(v) } : {}}>
                            {v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` : '--'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Part 4 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#f1f5f9] flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-[#1e293b]">70个大中城市商品房销售价格指数（近12个月，最新月靠左）</h3>
          <select className="border border-[#e2e8f0] rounded text-[10px] px-1 py-0.5 text-[#64748b]" value={priceSort || ''}
            onChange={e => {
              const v = e.target.value || null;
              if (v === priceSort) setPriceDir(d => d === 'asc' ? 'desc' : 'asc');
              else { setPriceSort(v); setPriceDir('desc'); }
            }}>
            <option value="">默认排序</option>
            {rec12.map(m => <option key={m} value={m}>按{m}排序</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc]">
                <th className="border border-[#e2e8f0] px-3 py-2 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]" style={{ minWidth: 140 }}>指标</th>
                {rec12.map(m => (
                  <th key={m} className={`border border-[#e2e8f0] px-2 py-2 text-center font-semibold min-w-[54px] cursor-pointer hover:bg-[#e2e8f0] select-none ${priceSort === m ? 'text-[#2563eb] bg-blue-50' : 'text-[#475569]'}`}
                    onClick={() => { if (priceSort === m) setPriceDir(d => d === 'asc' ? 'desc' : 'asc'); else { setPriceSort(m); setPriceDir('desc'); } }}>
                    <span className="text-[11px]">{m.slice(2)}</span>
                    <span className="text-[9px] ml-0.5">{priceSort === m ? (priceDir === 'desc' ? '▼' : '▲') : ''}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {priceGroups.map((grp) => (
                <>
                  <tr key={grp.header} className="bg-[#f0f4ff]">
                    <td colSpan={rec12.length + 1} className="border border-[#e2e8f0] px-3 py-1.5 text-xs font-bold text-[#1e40af]">
                      {grp.header}
                    </td>
                  </tr>
                  {grp.rows.map((row, ri) => (
                    <tr key={row.name} className={`group transition-colors hover:bg-blue-50/40 ${ri % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}`}>
                      <td className="sticky left-0 z-10 bg-inherit border-r-2 border-[#e2e8f0] px-3 py-1.5 text-[#334155] font-medium group-hover:bg-blue-50/40">
                        <span className="ml-3">{row.windId ? <WindIdHover id={row.windId}>{row.name}</WindIdHover> : row.name}</span>
                      </td>
                      {row.values.map((v, ci) => (
                        <td key={ci} className="border border-[#e2e8f0] px-2 py-1.5 text-center tabular-nums font-mono text-[11px]"
                          style={v != null ? { backgroundColor: getHeatBg(v), color: getHeatText(v) } : {}}>
                          {v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` : '--'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <IndicatorExplanation title="房地产指标说明" items={[
        { label: '指标定义', content: '房地产开发投资完成额指报告期内完成的全部用于房屋建设工程、土地开发工程的投资额。房屋新开工面积、竣工面积和销售面积/销售额反映房地产市场的供需两端。' },
        { label: '数据来源', content: '国家统计局（www.stats.gov.cn），每月中旬公布。' },
        { label: '指标意义', content: '房地产业链条长、关联广，占GDP约15%。销售、新开工等领先指标可预测后续投资走势。70城房价指数反映全国房价趋势。' },
      ]} />
    </div>
  );
}

export default RealEstateModule;
