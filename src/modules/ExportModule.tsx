import { useMemo, useState } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { getPrevMonthStr, months } from '../data/economicData';
import {
  exp当月同比, exp累计同比,
  exp机电产品_mom, exp高新技术产品_mom, exp集成电路_mom, exp汽车_mom,
  exp船舶_mom, exp手机_mom, exp自动数据处理设备_mom, exp钢材_mom,
  exp塑料制品_mom, exp纺织纱线_mom, exp服装_mom, exp家具_mom,
  exp家电_mom, exp汽车零配件_mom, exp农产品_mom, exp成品油_mom,
  exp通用机械_mom, exp玩具_mom, exp医疗仪器_mom, exp肥料_mom,
  exp机电产品_cum, exp高新技术产品_cum, exp集成电路_cum, exp汽车_cum,
  exp船舶_cum, exp手机_cum, exp自动数据处理设备_cum, exp钢材_cum,
  exp塑料制品_cum, exp纺织纱线_cum, exp服装_cum, exp家具_cum,
  exp家电_cum, exp汽车零配件_cum, exp农产品_cum, exp成品油_cum,
  exp通用机械_cum, exp玩具_cum, exp医疗仪器_cum, exp肥料_cum,
  exp机电产品_ring, exp高新技术产品_ring, exp集成电路_ring, exp服装_ring,
  exp家电_ring, exp汽车零配件_ring, exp玩具_ring,
  exp美国_cum, exp欧盟_cum, exp日本_cum, exp东盟_cum, exp韩国_cum, exp印度_cum, exp一带一路_cum,
  exp美国_val, exp欧盟_val, exp日本_val, exp东盟_val, exp韩国_val, exp印度_val, exp一带一路_val,
  exportRegions,
  type ExpItem,

  exp汽车_ring, exp船舶_ring, exp手机_ring, exp自动数据处理设备_ring,
  exp钢材_ring, exp塑料制品_ring, exp纺织纱线_ring, exp家具_ring,
  exp农产品_ring, exp成品油_ring, exp通用机械_ring, exp医疗仪器_ring,
  exp肥料_ring,

  // New products
  exp存储部件847170_mom, exp存储部件847170_cum,
  exp制造半导体器件或IC的物理气相沉积装置84862022_mom, exp制造半导体器件或IC的物理气相沉积装置84862022_cum,
  exp风力发电机组850231_mom, exp风力发电机组850231_cum,
  exp光敏半导体器件8541_mom, exp光敏半导体器件8541_cum,
  exp锂离子蓄电池_mom, exp锂离子蓄电池_cum,
  exp电动汽车_mom, exp电动汽车_cum,
  exp基本有机化学品_mom, exp基本有机化学品_cum,
  exp冰箱_mom, exp冰箱_cum,
  exp空调_mom, exp空调_cum,
  exp电扇_mom, exp电扇_cum,
} from '../data/exportExcelData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';
import { WindIdHover } from '../components/WindIdHover';

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
    '存储部件(847170)', '制造半导体器件或IC的物理气相沉积装置(84862022)',
  ]},
  { label: '能源转型相关', color: '#16a34a', items: [
    '汽车包括底盘', '汽车零配件', '风力发电机组(850231)',
    '光敏半导体器件(8541)', '锂离子蓄电池', '电动汽车',
  ]},
  { label: '非AI制造业相关', color: '#7c3aed', items: [
    '机电产品', '通用机械设备', '船舶',
  ]},
  { label: '化工相关', color: '#ea580c', items: [
    '成品油', '肥料(HS31章)', '基本有机化学品',
  ]},
  { label: '传统制造业相关', color: '#0891b2', items: [
    '手机', '钢材', '塑料制品', '纺织纱线织物及其制品',
    '服装及衣着附件', '家具及其零件',
    '冰箱', '空调', '电扇', '玩具',
  ]},
  { label: '其他', color: '#6b7280', items: [
    '医疗仪器及器械', '农产品',
  ]},
];

const allProducts = PRODUCT_GROUPS.flatMap(g => g.items);

export function ExportModule() {
  const cy = Number(getPrevMonthStr().slice(0, 4));
  const rec12 = recentN(12);

  // 1. 累计同比折线图
  const drCum = useChartDateRange(2020, 1);
  const cumOption = useMemo(() => {
    const all = months.filter(m => m >= drCum.startStr && m <= drCum.endStr && exp累计同比.values[m] != null);
    return {
      tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
      grid: { top: 10, right: 30, bottom: 30, left: 50 },
      xAxis: { type: 'category', data: all, axisLabel: { color: '#64748b', fontSize: 9, rotate: 30 } },
      yAxis: { type: 'value', name: '%' },
      series: [{ type: 'line', data: all.map(m => round(exp累计同比.values[m])), smooth: true, lineStyle: { color: '#ef4444', width: 2.5 }, itemStyle: { color: '#ef4444' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(239,68,68,0.15)' }, { offset: 1, color: 'rgba(239,68,68,0)' }] } }, symbol: 'circle', symbolSize: 3 }],
    };
  }, [drCum.startStr, drCum.endStr]);

  // 2. 当月同比柱状图
  const drMom = useChartDateRange(cy - 1, 1);
  const momOption = useMemo(() => {
    const all = months.filter(m => m >= drMom.startStr && m <= drMom.endStr && exp当月同比.values[m] != null);
    return {
      tooltip: { trigger: 'axis' as const }, grid: { top: 10, right: 30, bottom: 30, left: 50 },
      xAxis: { type: 'category', data: all, axisLabel: { color: '#64748b', fontSize: 9, rotate: 30 } },
      yAxis: { type: 'value', name: '%' },
      series: [{ type: 'bar', data: all.map(m => round(exp当月同比.values[m])), barWidth: '50%',
        itemStyle: { color: (p: any) => (p.value ?? 0) >= 0 ? '#ef4444' : '#22c55e', borderRadius: [3, 3, 0, 0] },
      }],
    };
  }, [drMom.startStr, drMom.endStr]);

  // Product data maps
  const prodMomMap = useMemo(() => new Map(allProducts.map(n => [n, expByName(n + '_mom')])), []);
  const prodCumMap = useMemo(() => new Map(allProducts.map(n => [n, expByName(n + '_cum')])), []);

  const prodRingMap = useMemo(() => {
    const map = new Map<string, ExpItem>();
    for (const n of allProducts) {
      const ring = ringOrVal(n, '');
      map.set(n, ring || { months: [], values: {} as Record<string, number | null> });
    }
    return map;
  }, []);

  // Build grouped rows for product tables
  const [prodView, setProdView] = useState<'yoy' | 'mom'>('yoy');
  const [prodSort, setProdSort] = useState<string | null>(null);
  const [prodSortDir, setProdSortDir] = useState<'asc' | 'desc'>('desc');

  const groupedProdRows = useMemo(() => {
    type RowItem = { type: 'group'; label: string; color: string } | { type: 'item'; name: string; values: (number | null)[] };
    const result: RowItem[] = [];
    for (const g of PRODUCT_GROUPS) {
      result.push({ type: 'group', label: g.label, color: g.color });
      const items = g.items.map(name => ({
        type: 'item' as const,
        name,
        values: rec12.map(m => {
          const map = prodView === 'yoy' ? prodMomMap : prodRingMap;
          return round(map.get(name)?.values[m] ?? null);
        }),
      }));
      // Sort within group if sort is active
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

  // Cumulative product table (grouped)
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

  // Region tables (unchanged)
  const [regSort, setRegSort] = useState<string | null>(null);
  const [regSortDir, setRegSortDir] = useState<'asc' | 'desc'>('desc');
  const regionCumRows = useMemo(() => {
    const map = new Map(exportRegions.map(n => [n, expByName(n + '_cum')]));
    return sortRows(exportRegions.map(n => ({ name: n, values: rec12.map(m => round(map.get(n)?.values[m] ?? null)) })), regSort, regSortDir, rec12);
  }, [rec12, regSort, regSortDir]);

  const [pctSort, setPctSort] = useState<string | null>(null);
  const [pctSortDir, setPctSortDir] = useState<'asc' | 'desc'>('desc');
  const regionPctRows = useMemo(() => {
    const valMap = new Map(exportRegions.map(n => [n, expByName(n + '_val')]));
    return sortRows(exportRegions.map(n => {
      return { name: n, values: rec12.map(m => {
        const total = exportRegions.reduce((s, r) => s + (expByName(r + '_val').values[m] ?? 0), 0);
        return total > 0 ? round(((valMap.get(n)?.values[m] ?? 0) / total) * 100) : null;
      }) };
    }), pctSort, pctSortDir, rec12);
  }, [rec12, pctSort, pctSortDir]);

  return (
    <div className="space-y-4">
      <ChartCard title={<WindIdHover id="M0043677">出口金额累计同比</WindIdHover>} subtitle={`${drCum.startStr} ~ ${drCum.endStr}`} dateRange={drCum}>
        <ReactECharts option={cumOption} style={{ height: 380 }} />
      </ChartCard>

      <ChartCard title={<WindIdHover id="M0000607">出口金额当月同比</WindIdHover>} subtitle={`${drMom.startStr} ~ ${drMom.endStr}`} dateRange={drMom}>
        <ReactECharts option={momOption} style={{ height: 380 }} />
      </ChartCard>

      {renderGroupedProdTable('出口产品当月同比和环比情况', groupedProdRows, prodSort, setProdSort, prodSortDir, setProdSortDir, prodView, setProdView)}

      {renderGroupedTable('出口产品累计同比情况', false, rec12, groupedCumRows, cumSort, setCumSort, cumSortDir, setCumSortDir, exportProductWindId)}

      {renderTable('出口地区累计同比情况', false, rec12, regionCumRows, regSort, setRegSort, regSortDir, setRegSortDir)}

      {renderTable('出口地区出口值百分比情况', true, rec12, regionPctRows, pctSort, setPctSort, pctSortDir, setPctSortDir)}

      <IndicatorExplanation title="出口指标说明" items={[
        { label: '指标定义', content: '出口总额指报告期内实际离开中国关境的货物价值总和，以美元计价。' },
        { label: '数据来源', content: '海关总署（www.customs.gov.cn），每月中旬公布上月数据。' },
        { label: '指标意义', content: '出口是拉动GDP增长的"三驾马车"之一，也是外汇储备的主要来源。' },
      ]} />
    </div>
  );
}

/* ─── 数据查找 helpers ─── */
function expByName(name: string): ExpItem {
  const map: Record<string, ExpItem> = {
    '机电产品_mom': exp机电产品_mom, '高新技术产品_mom': exp高新技术产品_mom, '集成电路_mom': exp集成电路_mom,
    '汽车_mom': exp汽车_mom, '船舶_mom': exp船舶_mom, '手机_mom': exp手机_mom,
    '自动数据处理设备_mom': exp自动数据处理设备_mom, '钢材_mom': exp钢材_mom, '塑料制品_mom': exp塑料制品_mom,
    '纺织纱线_mom': exp纺织纱线_mom, '服装_mom': exp服装_mom, '家具_mom': exp家具_mom,
    '家电_mom': exp家电_mom, '汽车零配件_mom': exp汽车零配件_mom, '农产品_mom': exp农产品_mom,
    '成品油_mom': exp成品油_mom, '通用机械_mom': exp通用机械_mom, '玩具_mom': exp玩具_mom,
    '医疗仪器_mom': exp医疗仪器_mom, '肥料_mom': exp肥料_mom,
    // Renamed products (same data source, new display name)
    '汽车包括底盘_mom': exp汽车_mom, '通用机械设备_mom': exp通用机械_mom,
    '肥料(HS31章)_mom': exp肥料_mom,
    '纺织纱线织物及其制品_mom': exp纺织纱线_mom,
    '服装及衣着附件_mom': exp服装_mom,
    '家具及其零件_mom': exp家具_mom,
    '自动数据处理设备及其零部件_mom': exp自动数据处理设备_mom,
    '医疗仪器及器械_mom': exp医疗仪器_mom,
    // New products
    '存储部件(847170)_mom': exp存储部件847170_mom,
    '制造半导体器件或IC的物理气相沉积装置(84862022)_mom': exp制造半导体器件或IC的物理气相沉积装置84862022_mom,
    '风力发电机组(850231)_mom': exp风力发电机组850231_mom,
    '光敏半导体器件(8541)_mom': exp光敏半导体器件8541_mom,
    '锂离子蓄电池_mom': exp锂离子蓄电池_mom,
    '电动汽车_mom': exp电动汽车_mom,
    '基本有机化学品_mom': exp基本有机化学品_mom,
    '冰箱_mom': exp冰箱_mom, '空调_mom': exp空调_mom, '电扇_mom': exp电扇_mom,
    // ---- cum ----
    '机电产品_cum': exp机电产品_cum, '高新技术产品_cum': exp高新技术产品_cum, '集成电路_cum': exp集成电路_cum,
    '汽车_cum': exp汽车_cum, '船舶_cum': exp船舶_cum, '手机_cum': exp手机_cum,
    '自动数据处理设备_cum': exp自动数据处理设备_cum, '钢材_cum': exp钢材_cum, '塑料制品_cum': exp塑料制品_cum,
    '纺织纱线_cum': exp纺织纱线_cum, '服装_cum': exp服装_cum, '家具_cum': exp家具_cum,
    '家电_cum': exp家电_cum, '汽车零配件_cum': exp汽车零配件_cum, '农产品_cum': exp农产品_cum,
    '成品油_cum': exp成品油_cum, '通用机械_cum': exp通用机械_cum, '玩具_cum': exp玩具_cum,
    '医疗仪器_cum': exp医疗仪器_cum, '肥料_cum': exp肥料_cum,
    // Renamed products cum
    '汽车包括底盘_cum': exp汽车_cum, '通用机械设备_cum': exp通用机械_cum,
    '肥料(HS31章)_cum': exp肥料_cum,
    '纺织纱线织物及其制品_cum': exp纺织纱线_cum,
    '服装及衣着附件_cum': exp服装_cum,
    '家具及其零件_cum': exp家具_cum,
    '自动数据处理设备及其零部件_cum': exp自动数据处理设备_cum,
    '医疗仪器及器械_cum': exp医疗仪器_cum,
    // New products cum
    '存储部件(847170)_cum': exp存储部件847170_cum,
    '制造半导体器件或IC的物理气相沉积装置(84862022)_cum': exp制造半导体器件或IC的物理气相沉积装置84862022_cum,
    '风力发电机组(850231)_cum': exp风力发电机组850231_cum,
    '光敏半导体器件(8541)_cum': exp光敏半导体器件8541_cum,
    '锂离子蓄电池_cum': exp锂离子蓄电池_cum,
    '电动汽车_cum': exp电动汽车_cum,
    '基本有机化学品_cum': exp基本有机化学品_cum,
    '冰箱_cum': exp冰箱_cum, '空调_cum': exp空调_cum, '电扇_cum': exp电扇_cum,
    // Regions
    '美国_cum': exp美国_cum, '欧盟_cum': exp欧盟_cum, '日本_cum': exp日本_cum, '东盟_cum': exp东盟_cum, '韩国_cum': exp韩国_cum, '印度_cum': exp印度_cum, '一带一路_cum': exp一带一路_cum,
    '美国_val': exp美国_val, '欧盟_val': exp欧盟_val, '日本_val': exp日本_val, '东盟_val': exp东盟_val, '韩国_val': exp韩国_val, '印度_val': exp印度_val, '一带一路_val': exp一带一路_val,
  };
  return map[name] ?? { months: [], values: {} };
}

function ringOrVal(name: string, _month: string): ExpItem | null {
  const map: Record<string, ExpItem> = {
    '机电产品': exp机电产品_ring, '高新技术产品': exp高新技术产品_ring,
    '集成电路': exp集成电路_ring, '汽车': exp汽车_ring, '船舶': exp船舶_ring,
    '手机': exp手机_ring, '自动数据处理设备': exp自动数据处理设备_ring,
    '钢材': exp钢材_ring, '塑料制品': exp塑料制品_ring,
    '纺织纱线': exp纺织纱线_ring, '服装': exp服装_ring,
    '家具': exp家具_ring, '家电': exp家电_ring,
    '汽车零配件': exp汽车零配件_ring, '农产品': exp农产品_ring,
    '成品油': exp成品油_ring, '通用机械': exp通用机械_ring,
    '玩具': exp玩具_ring, '医疗仪器': exp医疗仪器_ring, '肥料': exp肥料_ring,
    // Renamed (same data)
    '汽车包括底盘': exp汽车_ring, '通用机械设备': exp通用机械_ring,
    '肥料(HS31章)': exp肥料_ring, '纺织纱线织物及其制品': exp纺织纱线_ring,
    '服装及衣着附件': exp服装_ring, '家具及其零件': exp家具_ring,
    '自动数据处理设备及其零部件': exp自动数据处理设备_ring,
    '医疗仪器及器械': exp医疗仪器_ring,
  };
  return map[name] || null;
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

/* ─── 分组产品表（当月同比/环比） ─── */
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
            <button onClick={() => setProdView('yoy')} className={`px-3 py-1 text-xs rounded-md transition-all ${prodView === 'yoy' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-[#64748b] hover:text-[#334155]'}`}>同比</button>
            <button onClick={() => setProdView('mom')} className={`px-3 py-1 text-xs rounded-md transition-all ${prodView === 'mom' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-[#64748b] hover:text-[#334155]'}`}>环比</button>
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
                      const wid = prodView === 'yoy' ? exportProductMomWindId(row.name) : exportProductRingWindId(row.name);
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

/* ─── 分组产品表（累计同比） ─── */
function renderGroupedTable(
  title: string, isPct: boolean, recMonths: string[],
  rows: ({ type: 'group'; label: string; color: string } | { type: 'item'; name: string; values: (number | null)[] })[],
  sortBy: string | null, setSortBy: (v: string | null) => void,
  sortDir: 'asc' | 'desc', setSortDir: (d: 'asc' | 'desc') => void,
  windIdFn?: (name: string) => string,
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
              <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">{isPct ? '地区' : '类别'}</th>
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
                    {windIdFn && windIdFn(row.name) ? (
                      <WindIdHover id={windIdFn(row.name)}>{row.name}</WindIdHover>
                    ) : row.name}
                  </td>
                  {row.values.map((v, ci) => (
                    <td key={ci} className="border border-[#e2e8f0] px-1 py-1 text-center tabular-nums font-mono"
                      style={isPct ? {} : v != null ? { backgroundColor: HEAT_COLORS.getBg(v), color: HEAT_COLORS.getText(v) } : {}}>
                      {v != null ? (isPct ? `${v}%` : format(v)) : '-'}
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

/* ─── 非分组表（地区） ─── */
function renderTable(
  title: string, isPct: boolean, recMonths: string[],
  rows: { name: string; values: (number | null)[] }[],
  sortBy: string | null, setSortBy: (v: string | null) => void,
  sortDir: 'asc' | 'desc', setSortDir: (d: 'asc' | 'desc') => void,
  windIdFn?: (name: string) => string,
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
              <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">{isPct ? '地区' : '类别'}</th>
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
                <td className="sticky left-0 z-10 bg-white border-r-2 border-[#cbd5e1] px-2 py-1.5 text-[#334155] font-medium group-hover:bg-blue-50/40">
                  {windIdFn && windIdFn(row.name) ? (
                    <WindIdHover id={windIdFn(row.name)}>{row.name}</WindIdHover>
                  ) : row.name}
                </td>
                {row.values.map((v, ci) => (
                  <td key={ci} className="border border-[#e2e8f0] px-1 py-1 text-center tabular-nums font-mono"
                    style={isPct ? {} : v != null ? { backgroundColor: HEAT_COLORS.getBg(v), color: HEAT_COLORS.getText(v) } : {}}>
                    <div>{v != null ? (isPct ? `${v}%` : format(v)) : '-'}</div>
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

function format(v: number): string {
  if (v === null || v === undefined) return '-';
  return (v >= 0 ? '+' : '') + v.toFixed(1);
}

/* ─── Wind ID 映射（累计同比） ─── */
function exportProductWindId(name: string): string {
  const map: Record<string, string> = {
    '机电产品': 'M0041450',
    '高新技术产品': 'M0041441',
    '集成电路': 'S0179136',
    '汽车包括底盘': 'S0046778', '汽车': 'S0046778',
    '船舶': 'S0117231',
    '手机': 'S0270451',
    '自动数据处理设备及其零部件': 'S0270436', '自动数据处理设备': 'S0270436',
    '钢材': 'M0041431',
    '塑料制品': 'S0073032',
    '纺织纱线织物及其制品': 'M0041444', '纺织纱线': 'M0041444',
    '服装及衣着附件': 'M0041434', '服装': 'M0041434',
    '家具及其零件': 'S0071114', '家具': 'S0071114',
    '家电': 'S0270452',
    '汽车零配件': 'S0071119',
    '农产品': 'S0071113',
    '成品油': 'M0041423',
    '通用机械设备': 'S0270435', '通用机械': 'S0270435',
    '玩具': 'M0041455',
    '医疗仪器及器械': 'S0071126', '医疗仪器': 'S0071126',
    '肥料(HS31章)': 'S0117264', '肥料': 'S0117264',
    // New products
    '存储部件(847170)': 'S0179118',
    '制造半导体器件或IC的物理气相沉积装置(84862022)': 'J9811205',
    '风力发电机组(850231)': 'S0255621',
    '光敏半导体器件(8541)': 'Q2240989',
    '锂离子蓄电池': 'S0270447',
    '电动汽车': 'D6394378',
    '基本有机化学品': 'M7066412',
    '冰箱': 'S0179112',
    '空调': 'M0041452',
    '电扇': 'S0179110',
  };
  return map[name] ?? '';
}

/* ─── Wind ID 映射（当月同比） ─── */
function exportProductMomWindId(name: string): string {
  const map: Record<string, string> = {
    '机电产品': 'M7071617',
    '高新技术产品': 'M7071879',
    '集成电路': 'M7071789',
    '汽车包括底盘': 'M7071810', '汽车': 'M7071810',
    '船舶': 'M7071833',
    '手机': 'M7071730',
    '自动数据处理设备及其零部件': 'M7071684', '自动数据处理设备': 'M7071684',
    '钢材': 'M7071581',
    '塑料制品': 'M7071476',
    '纺织纱线织物及其制品': 'M7071521', '纺织纱线': 'M7071521',
    '服装及衣着附件': 'M7071541', '服装': 'M7071541',
    '家具及其零件': 'M7071597', '家具': 'M7071597',
    '家电': 'M7071732',
    '汽车零配件': 'M7071823',
    '农产品': 'M7071355',
    '成品油': 'M7071406',
    '通用机械设备': 'M7071651', '通用机械': 'M7071651',
    '玩具': 'M7071602',
    '医疗仪器及器械': 'M7071860', '医疗仪器': 'M7071860',
    '肥料(HS31章)': 'L1448567', '肥料': 'L1448567',
    // New products
    '存储部件(847170)': 'T5173757',
    '制造半导体器件或IC的物理气相沉积装置(84862022)': 'O0861129',
    '风力发电机组(850231)': 'L4117132',
    '光敏半导体器件(8541)': 'V4001796',
    '锂离子蓄电池': 'M7071711',
    '电动汽车': 'C9747607',
    '基本有机化学品': 'M7071432',
    '冰箱': 'M7071738',
    '空调': 'M7071736',
    '电扇': 'M7071734',
  };
  return map[name] ?? '';
}

/* ─── Wind ID 映射（环比） ─── */
function exportProductRingWindId(name: string): string {
  const map: Record<string, string> = {
    '机电产品': 'Z3023081',
    '高新技术产品': 'L6559277',
    '集成电路': 'A0136439',
    '汽车包括底盘': 'A4822102', '汽车': 'A4822102',
    '船舶': 'F4207072',
    '手机': 'V4766505',
    '自动数据处理设备及其零部件': 'D6927686', '自动数据处理设备': 'D6927686',
    '钢材': 'Y8336010',
    '塑料制品': 'B9594258',
    '纺织纱线织物及其制品': 'F3777978', '纺织纱线': 'F3777978',
    '服装及衣着附件': 'O6718327', '服装': 'O6718327',
    '家具及其零件': 'P2418101', '家具': 'P2418101',
    '家电': 'Z9220052',
    '汽车零配件': 'Q9767994',
    '农产品': 'R3088362',
    '成品油': 'K8526266',
    '通用机械设备': 'U3449835', '通用机械': 'U3449835',
    '玩具': 'D7639872',
    '医疗仪器及器械': 'L5222705', '医疗仪器': 'L5222705',
    '肥料(HS31章)': 'B2494076', '肥料': 'B2494076',
  };
  return map[name] ?? '';
}

export default ExportModule;
