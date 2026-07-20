import { useMemo, useState } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { getPrevMonthStr, months } from '../data/economicData';
import {
  imp累计同比, imp当月同比,
  imp原油_cum, imp原油_mom, imp原油_yoy,
  imp天然气_cum, imp天然气_mom, imp天然气_yoy,
  imp农产品_cum, imp农产品_mom, imp农产品_yoy,
  imp机电产品_cum, imp机电产品_mom, imp机电产品_yoy,
  imp高新技术产品_cum, imp高新技术产品_mom, imp高新技术产品_yoy,
  imp钢材_cum, imp钢材_mom, imp钢材_yoy,
  imp铁矿砂及其精矿_cum, imp铁矿砂及其精矿_mom, imp铁矿砂及其精矿_yoy,
  imp煤及褐煤_cum, imp煤及褐煤_mom, imp煤及褐煤_yoy,
  imp汽车包括底盘_cum, imp汽车包括底盘_mom, imp汽车包括底盘_yoy,
  imp大豆_cum, imp大豆_mom, imp大豆_yoy,
  imp成品油_cum, imp成品油_mom, imp成品油_yoy,
  imp集成电路_cum, imp集成电路_mom, imp集成电路_yoy,
  imp自动数据处理设备及其零部件_cum, imp自动数据处理设备及其零部件_mom, imp自动数据处理设备及其零部件_yoy,
  imp铜矿砂及其精矿_cum, imp铜矿砂及其精矿_mom, imp铜矿砂及其精矿_yoy,
  imp原木及锯材_cum, imp原木及锯材_mom, imp原木及锯材_yoy,
  imp汽车零配件_cum, imp汽车零配件_mom, imp汽车零配件_yoy,
  imp通用机械设备_cum, imp通用机械设备_mom, imp通用机械设备_yoy,
  imp机床_cum, imp机床_mom, imp机床_yoy,
  imp肥料_cum, imp肥料_mom, imp肥料_yoy,
  imp基本有机化学品_cum, imp基本有机化学品_mom, imp基本有机化学品_yoy,
  imp初级形状的塑料_cum, imp初级形状的塑料_mom, imp初级形状的塑料_yoy,
  imp天然及合成橡胶_cum, imp天然及合成橡胶_mom, imp天然及合成橡胶_yoy,
  imp医药材及药品_cum, imp医药材及药品_mom, imp医药材及药品_yoy,
  imp纸浆_cum, imp纸浆_mom, imp纸浆_yoy,
  imp日本_cum, imp欧盟_cum, imp美国_cum, imp东盟_cum,
  importRegions,
  type ImpItem,
} from '../data/importExcelData';
import { IndicatorExplanation } from '../components/IndicatorExplanation';
import { WindIdHover } from '../components/WindIdHover';
import ReactECharts from 'echarts-for-react';

function round(v: number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return Math.round(v * 10) / 10;
}

const HEAT_COLORS = {
  getBg: (v: number) => {
    if (v === 0) return '#d1d5db';
    if (v > 0) {
      const t = Math.min(v / 10, 1);
      if (t < 0.15) return '#fee2e2'; if (t < 0.3) return '#fecaca'; if (t < 0.45) return '#fca5a5';
      if (t < 0.6) return '#f87171'; if (t < 0.8) return '#ef4444'; return '#b91c1c';
    }
    const t = Math.min(Math.abs(v) / 10, 1);
    if (t < 0.15) return '#dcfce7'; if (t < 0.3) return '#bbf7d0'; if (t < 0.45) return '#86efac';
    if (t < 0.6) return '#4ade80'; if (t < 0.8) return '#22c55e'; return '#15803d';
  },
  getText: (v: number) => Math.abs(v) > 8 ? '#fff' : '#1f2937',
};

function recentN(n: number): string[] {
  const lm = getPrevMonthStr();
  const y = Number(lm.slice(0, 4)), m = Number(lm.slice(5, 7));
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    let mm = m - i, yy = y;
    while (mm <= 0) { mm += 12; yy--; }
    out.push(`${yy}-${String(mm).padStart(2, '0')}`);
  }
  return out;
}

// ===== 产品分组定义 =====
const PRODUCT_GROUPS = [
  { label: 'AI相关产品', color: '#2563eb', items: [
    '集成电路', '自动数据处理设备及其零部件', '高新技术产品',
  ]},
  { label: '资源相关', color: '#16a34a', items: [
    '原油', '成品油', '煤及褐煤', '铁矿砂及其精矿', '铜矿砂及其精矿', '原木及锯材',
  ]},
  { label: '汽车相关', color: '#7c3aed', items: [
    '汽车包括底盘', '汽车零配件',
  ]},
  { label: '非AI制造业相关', color: '#ea580c', items: [
    '通用机械设备', '机床',
  ]},
  { label: '化工相关', color: '#0891b2', items: [
    '肥料', '基本有机化学品', '初级形状的塑料',
  ]},
  { label: '农产品相关', color: '#d97706', items: [
    '农产品', '大豆', '天然及合成橡胶',
  ]},
  { label: '其他', color: '#6b7280', items: [
    '医药材及药品', '纸浆',
  ]},
];

const allProducts = PRODUCT_GROUPS.flatMap(g => g.items);

function impByName(name: string): ImpItem {
  const map: Record<string, ImpItem> = {
    '原油_mom': imp原油_mom, '原油_yoy': imp原油_yoy, '原油_cum': imp原油_cum,
    '天然气_mom': imp天然气_mom, '天然气_yoy': imp天然气_yoy, '天然气_cum': imp天然气_cum,
    '农产品_mom': imp农产品_mom, '农产品_yoy': imp农产品_yoy, '农产品_cum': imp农产品_cum,
    '机电产品_mom': imp机电产品_mom, '机电产品_yoy': imp机电产品_yoy, '机电产品_cum': imp机电产品_cum,
    '高新技术产品_mom': imp高新技术产品_mom, '高新技术产品_yoy': imp高新技术产品_yoy, '高新技术产品_cum': imp高新技术产品_cum,
    '钢材_mom': imp钢材_mom, '钢材_yoy': imp钢材_yoy, '钢材_cum': imp钢材_cum,
    '铁矿砂及其精矿_mom': imp铁矿砂及其精矿_mom, '铁矿砂及其精矿_yoy': imp铁矿砂及其精矿_yoy, '铁矿砂及其精矿_cum': imp铁矿砂及其精矿_cum,
    '煤及褐煤_mom': imp煤及褐煤_mom, '煤及褐煤_yoy': imp煤及褐煤_yoy, '煤及褐煤_cum': imp煤及褐煤_cum,
    '汽车包括底盘_mom': imp汽车包括底盘_mom, '汽车包括底盘_yoy': imp汽车包括底盘_yoy, '汽车包括底盘_cum': imp汽车包括底盘_cum,
    '大豆_mom': imp大豆_mom, '大豆_yoy': imp大豆_yoy, '大豆_cum': imp大豆_cum,
    '成品油_mom': imp成品油_mom, '成品油_yoy': imp成品油_yoy, '成品油_cum': imp成品油_cum,
    '集成电路_mom': imp集成电路_mom, '集成电路_yoy': imp集成电路_yoy, '集成电路_cum': imp集成电路_cum,
    '自动数据处理设备及其零部件_mom': imp自动数据处理设备及其零部件_mom, '自动数据处理设备及其零部件_yoy': imp自动数据处理设备及其零部件_yoy, '自动数据处理设备及其零部件_cum': imp自动数据处理设备及其零部件_cum,
    '铜矿砂及其精矿_mom': imp铜矿砂及其精矿_mom, '铜矿砂及其精矿_yoy': imp铜矿砂及其精矿_yoy, '铜矿砂及其精矿_cum': imp铜矿砂及其精矿_cum,
    '原木及锯材_mom': imp原木及锯材_mom, '原木及锯材_yoy': imp原木及锯材_yoy, '原木及锯材_cum': imp原木及锯材_cum,
    '汽车零配件_mom': imp汽车零配件_mom, '汽车零配件_yoy': imp汽车零配件_yoy, '汽车零配件_cum': imp汽车零配件_cum,
    '通用机械设备_mom': imp通用机械设备_mom, '通用机械设备_yoy': imp通用机械设备_yoy, '通用机械设备_cum': imp通用机械设备_cum,
    '机床_mom': imp机床_mom, '机床_yoy': imp机床_yoy, '机床_cum': imp机床_cum,
    '肥料_mom': imp肥料_mom, '肥料_yoy': imp肥料_yoy, '肥料_cum': imp肥料_cum,
    '基本有机化学品_mom': imp基本有机化学品_mom, '基本有机化学品_yoy': imp基本有机化学品_yoy, '基本有机化学品_cum': imp基本有机化学品_cum,
    '初级形状的塑料_mom': imp初级形状的塑料_mom, '初级形状的塑料_yoy': imp初级形状的塑料_yoy, '初级形状的塑料_cum': imp初级形状的塑料_cum,
    '天然及合成橡胶_mom': imp天然及合成橡胶_mom, '天然及合成橡胶_yoy': imp天然及合成橡胶_yoy, '天然及合成橡胶_cum': imp天然及合成橡胶_cum,
    '医药材及药品_mom': imp医药材及药品_mom, '医药材及药品_yoy': imp医药材及药品_yoy, '医药材及药品_cum': imp医药材及药品_cum,
    '纸浆_mom': imp纸浆_mom, '纸浆_yoy': imp纸浆_yoy, '纸浆_cum': imp纸浆_cum,
    // Regions
    '日本_cum': imp日本_cum, '欧盟_cum': imp欧盟_cum, '美国_cum': imp美国_cum, '东盟_cum': imp东盟_cum,
  };
  return map[name] ?? { months: [], values: {} };
}

function sortRows<T extends { values: (number | null)[] }>(rows: T[], col: string | null, dir: 'asc' | 'desc', months: string[]): T[] {
  if (!col) return rows;
  const idx = months.indexOf(col);
  if (idx < 0) return rows;
  return [...rows].sort((a, b) => {
    const va = a.values[idx] ?? -9999, vb = b.values[idx] ?? -9999;
    return dir === 'desc' ? vb - va : va - vb;
  });
}

function format(v: number): string {
  if (v === null || v === undefined) return '-';
  return (v >= 0 ? '+' : '') + v.toFixed(1);
}

export function ImportModule() {
  const cy = Number(getPrevMonthStr().slice(0, 4));
  const rec12 = recentN(12);

  // 1. 进口金额累计同比 折线图
  const drCum = useChartDateRange(2020, 1);
  const cumOption = useMemo(() => {
    const all = months.filter(m => m >= drCum.startStr && m <= drCum.endStr && imp累计同比.values[m] != null);
    return {
      tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
      grid: { top: 10, right: 30, bottom: 30, left: 50 },
      xAxis: { type: 'category', data: all, axisLabel: { color: '#64748b', fontSize: 9, rotate: 30 } },
      yAxis: { type: 'value', name: '%' },
      series: [{ type: 'line', data: all.map(m => round(imp累计同比.values[m])), smooth: true, lineStyle: { color: '#f59e0b', width: 2.5 }, itemStyle: { color: '#f59e0b' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(245,158,11,0.15)' }, { offset: 1, color: 'rgba(245,158,11,0)' }] } }, symbol: 'circle', symbolSize: 3 }],
    };
  }, [drCum.startStr, drCum.endStr]);

  // 2. 进口金额当月同比 柱状图
  const drMom = useChartDateRange(cy - 1, 1);
  const momOption = useMemo(() => {
    const all = months.filter(m => m >= drMom.startStr && m <= drMom.endStr && imp当月同比.values[m] != null);
    return {
      tooltip: { trigger: 'axis' as const }, grid: { top: 10, right: 30, bottom: 30, left: 50 },
      xAxis: { type: 'category', data: all, axisLabel: { color: '#64748b', fontSize: 9, rotate: 30 } },
      yAxis: { type: 'value', name: '%' },
      series: [{ type: 'bar', data: all.map(m => round(imp当月同比.values[m])), barWidth: '50%',
        itemStyle: { color: (p: any) => (p.value ?? 0) >= 0 ? '#f59e0b' : '#22c55e', borderRadius: [3, 3, 0, 0] },
      }],
    };
  }, [drMom.startStr, drMom.endStr]);

  // Maps
  const prodYoyMap = useMemo(() => new Map(allProducts.map(n => [n, impByName(n + '_yoy')])), []);
  const prodMomMap = useMemo(() => new Map(allProducts.map(n => [n, impByName(n + '_mom')])), []);
  const prodCumMap = useMemo(() => new Map(allProducts.map(n => [n, impByName(n + '_cum')])), []);

  // 3. 进口产品当月同比和环比（分组表，支持同比/环比切换）
  const [prodView, setProdView] = useState<'yoy' | 'mom'>('yoy');
  const [prodSort, setProdSort] = useState<string | null>(null);
  const [prodSortDir, setProdSortDir] = useState<'asc' | 'desc'>('desc');

  const groupedProdRows = useMemo(() => {
    type RowItem = { type: 'group'; label: string; color: string } | { type: 'item'; name: string; values: (number | null)[] };
    const result: RowItem[] = [];
    const map = prodView === 'yoy' ? prodYoyMap : prodMomMap;
    for (const g of PRODUCT_GROUPS) {
      result.push({ type: 'group', label: g.label, color: g.color });
      const items = g.items.map(name => ({
        type: 'item' as const,
        name,
        values: rec12.map(m => {
          return round(map.get(name)?.values[m] ?? null);
        }),
      }));
      if (prodSort) {
        const idx = rec12.indexOf(prodSort);
        items.sort((a, b) => {
          const va = a.values[idx] ?? -9999, vb = b.values[idx] ?? -9999;
          return prodSortDir === 'desc' ? vb - va : va - vb;
        });
      }
      result.push(...items);
    }
    return result;
  }, [rec12, prodSort, prodSortDir, prodView]);

  // 4. 进口产品累计同比（分组表）
  const [cumSort, setCumSort] = useState<string | null>(null);
  const [cumSortDir, setCumSortDir] = useState<'asc' | 'desc'>('desc');

  const groupedCumRows = useMemo(() => {
    type RowItem = { type: 'group'; label: string; color: string } | { type: 'item'; name: string; values: (number | null)[] };
    const result: RowItem[] = [];
    for (const g of PRODUCT_GROUPS) {
      result.push({ type: 'group', label: g.label, color: g.color });
      const items = g.items.map(name => ({
        type: 'item' as const,
        name,
        values: rec12.map(m => round(prodCumMap.get(name)?.values[m] ?? null)),
      }));
      if (cumSort) {
        const idx = rec12.indexOf(cumSort);
        items.sort((a, b) => {
          const va = a.values[idx] ?? -9999, vb = b.values[idx] ?? -9999;
          return cumSortDir === 'desc' ? vb - va : va - vb;
        });
      }
      result.push(...items);
    }
    return result;
  }, [rec12, cumSort, cumSortDir]);

  // 5. 进口地区累计同比
  const [regSort, setRegSort] = useState<string | null>(null);
  const [regSortDir, setRegSortDir] = useState<'asc' | 'desc'>('desc');
  const regionCumRows = useMemo(() => {
    const map = new Map(importRegions.map(n => [n, impByName(n + '_cum')]));
    return sortRows(importRegions.map(n => ({
      name: n,
      values: rec12.map(m => round(map.get(n)?.values[m] ?? null)),
    })), regSort, regSortDir, rec12);
  }, [rec12, regSort, regSortDir]);

  return (
    <div className="space-y-4">
      <ChartCard title={<WindIdHover id="M0043693">进口金额累计同比</WindIdHover>} subtitle={`${drCum.startStr} ~ ${drCum.endStr}`} dateRange={drCum}>
        <ReactECharts option={cumOption} style={{ height: 380 }} />
      </ChartCard>

      <ChartCard title={<WindIdHover id="M0000609">进口金额当月同比</WindIdHover>} subtitle={`${drMom.startStr} ~ ${drMom.endStr}`} dateRange={drMom}>
        <ReactECharts option={momOption} style={{ height: 380 }} />
      </ChartCard>

      {renderGroupedProdTable('进口产品当月同比和环比情况', groupedProdRows, prodSort, setProdSort, prodSortDir, setProdSortDir, prodView, setProdView)}

      {renderGroupedTable('进口产品累计同比情况', rec12, groupedCumRows, cumSort, setCumSort, cumSortDir, setCumSortDir)}

      {renderRegionTable('进口地区累计同比情况', rec12, regionCumRows, regSort, setRegSort, regSortDir, setRegSortDir)}

      <IndicatorExplanation title="进口指标说明" items={[
        { label: '指标定义', content: '进口总额指报告期内进入中国关境的货物价值总和，以美元计价。' },
        { label: '数据来源', content: '海关总署（www.customs.gov.cn），每月中旬公布上月数据。' },
        { label: '指标意义', content: '进口反映国内需求强度，大宗商品进口影响PPI走势。进口增速回升通常预示内需改善。' },
      ]} />
    </div>
  );
}

/* ─── 当月同比和环比分组表 ─── */
function renderGroupedProdTable(
  title: string,
  rows: ({ type: 'group'; label: string; color: string } | { type: 'item'; name: string; values: (number | null)[] })[],
  sortBy: string | null, setSortBy: (v: string | null) => void,
  sortDir: 'asc' | 'desc', setSortDir: (d: 'asc' | 'desc') => void,
  prodView: 'yoy' | 'mom', setProdView: (v: 'yoy' | 'mom') => void,
) {
  const recMonths = recentN(12);
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#f1f5f9] flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-[#1e293b]">{title}（近12个月，最新月靠左）</h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 bg-[#f1f5f9] rounded-lg p-0.5">
            <button onClick={() => setProdView('yoy')} className={`px-3 py-1 text-xs rounded-md transition-all ${prodView === 'yoy' ? 'bg-white text-amber-600 shadow-sm font-semibold' : 'text-[#64748b] hover:text-[#334155]'}`}>同比</button>
            <button onClick={() => setProdView('mom')} className={`px-3 py-1 text-xs rounded-md transition-all ${prodView === 'mom' ? 'bg-white text-amber-600 shadow-sm font-semibold' : 'text-[#64748b] hover:text-[#334155]'}`}>环比</button>
          </div>
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
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead><tr className="bg-[#f8fafc]">
            <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">产品</th>
            {recMonths.map(m => (
              <th key={m} className={`border border-[#e2e8f0] px-1.5 py-1.5 text-center font-semibold min-w-[52px] cursor-pointer hover:bg-[#e2e8f0] select-none ${sortBy === m ? 'text-[#2563eb] bg-blue-50' : 'text-[#475569]'}`}
                onClick={() => { if (sortBy === m) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(m); setSortDir('desc'); } }}>
                {m.slice(2)} {(sortBy === m ? (sortDir === 'desc' ? '▼' : '▲') : '⇅')}
              </th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((entry, ri) => {
              if (entry.type === 'group') {
                return (
                  <tr key={`g-${entry.label}-${ri}`} className="bg-[#f1f5f9]">
                    <td colSpan={1 + recMonths.length} className="sticky left-0 z-10 bg-[#f1f5f9] px-3 py-1.5 text-xs font-bold tracking-wide"
                      style={{ color: entry.color }}>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: entry.color }} />
                        {entry.label}
                      </span>
                    </td>
                  </tr>
                );
              }
              const row = entry;
              return (
                <tr key={`${row.name}-${ri}`} className="group transition-colors hover:bg-blue-50/40">
                  <td className="sticky left-0 z-10 bg-white border-r-2 border-[#cbd5e1] px-2 py-1.5 text-[#334155] font-medium group-hover:bg-blue-50/40">
                    {(() => {
                      const wid = prodView === 'yoy' ? importProductYoyWindId(row.name) : importProductMomWindId(row.name);
                      return wid ? <WindIdHover id={wid}>{row.name}</WindIdHover> : row.name;
                    })()}
                  </td>
                  {row.values.map((v, ci) => (
                    <td key={ci} className="border border-[#e2e8f0] px-1 py-1 text-center tabular-nums font-mono"
                      style={v != null ? { backgroundColor: HEAT_COLORS.getBg(v), color: HEAT_COLORS.getText(v) } : {}}>
                      {v != null ? format(v) : '-'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── 累计同比分组表 ─── */
function renderGroupedTable(
  title: string, recMonths: string[],
  rows: ({ type: 'group'; label: string; color: string } | { type: 'item'; name: string; values: (number | null)[] })[],
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
          <thead>
            <tr className="bg-[#f8fafc]">
              <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">类别</th>
              {recMonths.map(m => (
                <th key={m} className={`border border-[#e2e8f0] px-1.5 py-1.5 text-center font-semibold min-w-[52px] cursor-pointer hover:bg-[#e2e8f0] select-none ${sortBy === m ? 'text-[#2563eb] bg-blue-50' : 'text-[#475569]'}`}
                  onClick={() => { if (sortBy === m) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(m); setSortDir('desc'); } }}>
                  {m.slice(2)} {(sortBy === m ? (sortDir === 'desc' ? '▼' : '▲') : '⇅')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((entry, ri) => {
              if (entry.type === 'group') {
                return (
                  <tr key={`g-${entry.label}-${ri}`} className="bg-[#f1f5f9]">
                    <td colSpan={1 + recMonths.length} className="sticky left-0 z-10 bg-[#f1f5f9] px-3 py-1.5 text-xs font-bold tracking-wide"
                      style={{ color: entry.color }}>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: entry.color }} />
                        {entry.label}
                      </span>
                    </td>
                  </tr>
                );
              }
              const row = entry;
              return (
                <tr key={`${row.name}-${ri}`} className="group transition-colors hover:bg-blue-50/40">
                  <td className="sticky left-0 z-10 bg-white border-r-2 border-[#cbd5e1] px-2 py-1.5 text-[#334155] font-medium group-hover:bg-blue-50/40">
                    {(() => {
                      const wid = importProductCumWindId(row.name);
                      return wid ? <WindIdHover id={wid}>{row.name}</WindIdHover> : row.name;
                    })()}
                  </td>
                  {row.values.map((v, ci) => (
                    <td key={ci} className="border border-[#e2e8f0] px-1 py-1 text-center tabular-nums font-mono"
                      style={v != null ? { backgroundColor: HEAT_COLORS.getBg(v), color: HEAT_COLORS.getText(v) } : {}}>
                      {v != null ? format(v) : '-'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── 地区表（非分组） ─── */
function renderRegionTable(
  title: string, recMonths: string[],
  rows: { name: string; values: (number | null)[] }[],
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
          <thead>
            <tr className="bg-[#f8fafc]">
              <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">地区</th>
              {recMonths.map(m => (
                <th key={m} className={`border border-[#e2e8f0] px-1.5 py-1.5 text-center font-semibold min-w-[52px] cursor-pointer hover:bg-[#e2e8f0] select-none ${sortBy === m ? 'text-[#2563eb] bg-blue-50' : 'text-[#475569]'}`}
                  onClick={() => { if (sortBy === m) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(m); setSortDir('desc'); } }}>
                  {m.slice(2)} {(sortBy === m ? (sortDir === 'desc' ? '▼' : '▲') : '⇅')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.name} className="group transition-colors hover:bg-blue-50/40">
                <td className="sticky left-0 z-10 bg-white border-r-2 border-[#cbd5e1] px-2 py-1.5 text-[#334155] font-medium group-hover:bg-blue-50/40">{row.name}</td>
                {row.values.map((v, ci) => (
                  <td key={ci} className="border border-[#e2e8f0] px-1 py-1 text-center tabular-nums font-mono"
                    style={v != null ? { backgroundColor: HEAT_COLORS.getBg(v), color: HEAT_COLORS.getText(v) } : {}}>
                    {v != null ? format(v) : '-'}
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

/* ─── Wind ID Mappings ─── */
function importProductYoyWindId(name: string): string {
  const map: Record<string, string> = {
    '集成电路': 'M7072268',
    '自动数据处理设备及其零部件': 'M7069873',
    '高新技术产品': 'M7072336',
    '原油': 'M7072020',
    '成品油': 'M7072022',
    '煤及褐煤': 'M7072018',
    '铁矿砂及其精矿': 'M7072010',
    '铜矿砂及其精矿': 'M7072013',
    '原木及锯材': 'L7142203',
    '汽车包括底盘': 'M7072274',
    '汽车零配件': 'M7072285',
    '通用机械设备': 'M7072175',
    '机床': 'M7072190',
    '肥料': 'J6773854',
    '基本有机化学品': 'M7072051',
    '初级形状的塑料': 'M7069833',
    '农产品': 'M7071946',
    '大豆': 'M7071983',
    '天然及合成橡胶': 'M7072080',
    '医药材及药品': 'M7072062',
    '纸浆': 'P8692556',
    '机电产品': 'M7072145',
    '天然气': 'M7072033',
    '钢材': 'M7072278',
  };
  return map[name] ?? '';
}

function importProductMomWindId(name: string): string {
  const map: Record<string, string> = {
    '集成电路': 'Z6631674',
    '自动数据处理设备及其零部件': 'Z5061989',
    '高新技术产品': 'R4735118',
    '原油': 'X3730088',
    '成品油': 'F6911344',
    '煤及褐煤': 'R4735118',
    '铁矿砂及其精矿': 'L4757103',
    '铜矿砂及其精矿': 'C9008360',
    '原木及锯材': 'D1065882',
    '汽车包括底盘': 'C8365828',
    '汽车零配件': 'C9001470',
    '通用机械设备': 'T3694451',
    '机床': 'W8449957',
    '肥料': 'Y3307824',
    '基本有机化学品': '',
    '初级形状的塑料': 'Y0803643',
    '农产品': '',
    '大豆': '',
    '天然及合成橡胶': 'R0105974',
    '医药材及药品': 'Q9618275',
    '纸浆': 'Y3307824',
    '机电产品': 'Y0803643',
    '天然气': 'P0493026',
    '钢材': 'Y5910303',
  };
  return map[name] ?? '';
}

function importProductCumWindId(name: string): string {
  const map: Record<string, string> = {
    '集成电路': 'S0071924',
    '自动数据处理设备及其零部件': 'M6230361',
    '高新技术产品': 'M0048351',
    '原油': 'M0041651',
    '成品油': 'M0041600',
    '煤及褐煤': 'S0173746',
    '铁矿砂及其精矿': 'M0041576',
    '铜矿砂及其精矿': 'S0071948',
    '原木及锯材': 'M6230354',
    '汽车包括底盘': 'M0041633',
    '汽车零配件': 'S0071096',
    '通用机械设备': 'S0270794',
    '机床': 'S0270799',
    '肥料': 'M6233409',
    '基本有机化学品': 'S0270773',
    '初级形状的塑料': 'M6230352',
    '农产品': 'S0071085',
    '大豆': 'S0034387',
    '天然及合成橡胶': 'S0255544',
    '医药材及药品': 'M7066618',
    '纸浆': 'M6230355',
  };
  return map[name] ?? '';
}

export default ImportModule;
