import { useMemo, useState } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, getIndexRange } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';
import { WindIdHover } from '../components/WindIdHover';
import faiRaw from '../data/faiExcelData.json';

const faiData = faiRaw as {
  dates: string[];
  total_yoy: Record<string, number>;
  total_val: Record<string, number>;
  fields: Record<string, Record<string, number>>;
  mfg: Record<string, Record<string, number>>;
  svc: Record<string, Record<string, number>>;
  real_estate_ratio: Record<string, number>;
  field_ids: [string, string][];
  mfg_ids: [string, string][];
  svc_ids: [string, string][];
};

/* ─── 热力图 ─── */
function getHeatBg(v: number): string {
  if (v === 0) return '#e2e8f0';
  if (v > 0) {
    const t = Math.min(v / 20, 1);
    if (t < 0.1) return '#fef2f2'; if (t < 0.2) return '#fee2e2'; if (t < 0.35) return '#fecaca';
    if (t < 0.5) return '#fca5a5'; if (t < 0.7) return '#f87171';
    if (t < 0.85) return '#ef4444'; return '#b91c1c';
  }
  const t = Math.min(Math.abs(v) / 20, 1);
  if (t < 0.1) return '#f0fdf4'; if (t < 0.2) return '#dcfce7'; if (t < 0.35) return '#bbf7d0';
  if (t < 0.5) return '#86efac'; if (t < 0.7) return '#4ade80';
  if (t < 0.85) return '#22c55e'; return '#15803d';
}
function getHeatText(v: number): string { return Math.abs(v) > 12 ? '#fff' : '#1f2937'; }

function recent12(): string[] {
  const all = Object.keys(faiData.total_yoy).sort();
  const last12 = all.slice(-12);
  return last12.reverse();
}

function alignData(dataMap: Record<string, number>, months: string[]): (number | null)[] {
  return months.map(m => dataMap[m] ?? null);
}

type TableRow = { name: string; windId: string; values: (number | null)[] };

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
            <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">行业</th>
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
                  {row.windId ? <WindIdHover id={row.windId}>{row.name}</WindIdHover> : row.name}
                </td>
                {row.values.map((v, ci) => (
                  <td key={ci} className="border border-[#e2e8f0] px-1 py-1 text-center tabular-nums font-mono"
                    style={v != null ? { backgroundColor: getHeatBg(v), color: getHeatText(v) } : {}}>
                    {v != null ? `${v >= 0 ? '+' : ''}${v}%` : '--'}
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

export function FAIModule() {
  const rec12 = useMemo(() => recent12(), []);

  // Part 1: 固投累计同比折线图
  const dr1 = useChartDateRange(2018, 1);
  const chartMonths = useMemo(() => {
    return Object.keys(faiData.total_yoy).filter(m => m >= dr1.startStr && m <= dr1.endStr).sort();
  }, [dr1]);
  const chartData = useMemo(() => chartMonths.map(m => faiData.total_yoy[m] ?? null), [chartMonths]);

  // Part 2: 分领域
  const [fieldSort, setFieldSort] = useState<string | null>(null);
  const [fieldDir, setFieldDir] = useState<'asc' | 'desc'>('desc');
  const fieldRows = useMemo(() =>
    sortRows(faiData.field_ids.map(([name, wid]) => ({
      name, windId: wid,
      values: alignData(faiData.fields[name] || {}, rec12),
    })), fieldSort, fieldDir, rec12),
  [rec12, fieldSort, fieldDir]);

  // Part 3: 制造业分行业
  const [mfgSort, setMfgSort] = useState<string | null>(null);
  const [mfgDir, setMfgDir] = useState<'asc' | 'desc'>('desc');
  const mfgRows = useMemo(() =>
    sortRows(faiData.mfg_ids.map(([name, wid]) => ({
      name, windId: wid,
      values: alignData(faiData.mfg[name] || {}, rec12),
    })).filter(r => r.values.some(v => v != null)),
    mfgSort, mfgDir, rec12),
  [rec12, mfgSort, mfgDir]);

  // Part 4: 服务业分行业
  const [svcSort, setSvcSort] = useState<string | null>(null);
  const [svcDir, setSvcDir] = useState<'asc' | 'desc'>('desc');
  const svcRows = useMemo(() =>
    sortRows(faiData.svc_ids.map(([name, wid]) => ({
      name, windId: wid,
      values: alignData(faiData.svc[name] || {}, rec12),
    })).filter(r => r.values.some(v => v != null)),
    svcSort, svcDir, rec12),
  [rec12, svcSort, svcDir]);

  // Part 5: 房地产开发占比
  const dr5 = useChartDateRange(2010, 1);
  const reMonths = useMemo(() => {
    return Object.keys(faiData.real_estate_ratio).filter(m => m >= dr5.startStr && m <= dr5.endStr).sort();
  }, [dr5]);
  const reData = useMemo(() => reMonths.map(m => faiData.real_estate_ratio[m] ?? null), [reMonths]);

  return (
    <div className="space-y-4">
      {/* Part 1: 固投累计同比 */}
      <ChartCard title={<WindIdHover id="M0000273">固定资产投资累计同比增速</WindIdHover>} subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.fai}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: chartMonths, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: [{ type: 'line', data: chartData, connectNulls: true, smooth: true, name: '固投累计同比', lineStyle: { color: '#8b5cf6', width: 2 }, itemStyle: { color: '#8b5cf6' }, symbol: 'circle', symbolSize: 3, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(139,92,246,0.12)' }, { offset: 1, color: 'rgba(139,92,246,0)' }] } } }],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      {/* Part 2: 分领域表格 */}
      {renderTable('分领域固定资产投资累计同比增速', fieldRows, rec12, fieldSort, setFieldSort, fieldDir, setFieldDir)}

      {/* Part 3: 制造业分行业表格 */}
      {renderTable('制造业分行业固定资产投资累计同比增速', mfgRows, rec12, mfgSort, setMfgSort, mfgDir, setMfgDir)}

      {/* Part 4: 服务业分行业表格 */}
      {renderTable('服务业分行业固定资产投资累计同比增速', svcRows, rec12, svcSort, setSvcSort, svcDir, setSvcDir)}

      {/* Part 5: 房地产开发占比 */}
      <ChartCard title={<WindIdHover id="M5207653">房地产开发占固定资产投资完成额比重</WindIdHover>} subtitle={`${dr5.startStr} ~ ${dr5.endStr} | ${DATA_SOURCES.fai}`} dateRange={dr5}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' }, formatter: (p: any) => `${p[0]?.axisValue}<br/>占比: ${p[0]?.value}%` },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: reMonths, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: [{ type: 'line', data: reData, connectNulls: true, smooth: true, lineStyle: { color: '#f59e0b', width: 2 }, itemStyle: { color: '#f59e0b' }, symbol: 'circle', symbolSize: 3, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(245,158,11,0.15)' }, { offset: 1, color: 'rgba(245,158,11,0)' }] } } }],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      <IndicatorExplanation title="固定资产投资指标说明" items={[
        { label: '指标定义', content: '固定资产投资（不含农户）是以货币形式表现的在一定时期内完成的建造和购置固定资产的工作量。' },
        { label: '数据来源', content: '国家统计局（www.stats.gov.cn），每月中旬公布。' },
        { label: '指标意义', content: '固投是GDP重要组成部分。制造业投资反映企业信心，基建投资逆周期调节，房地产投资关联产业链广。' },
      ]} />
    </div>
  );
}

export default FAIModule;
