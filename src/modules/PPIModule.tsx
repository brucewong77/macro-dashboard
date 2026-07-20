import { useMemo, useState, Fragment } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, ppiData, getIndexRange, blankUnpublished, getPrevMonthIndex } from '../data/economicData';
import { ppiSubItemYoyReal, ppiSubItemMomReal, ppiIndustryYoyReal, ppiIndustryMomReal, DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';
import { WindIdHover } from '../components/WindIdHover';

// PPI分项同比Wind ID
const SUB_ITEM_YOY_IDS: Record<string, string> = {
  'PPI总指数': 'M0000610',
  '采掘工业': 'M0000655',
  '原材料工业': 'M0000656',
  '加工工业': 'M0000657',
  '食品': 'M0000658',
  '衣着': 'M0000659',
  '一般日用品': 'M0000660',
  '耐用消费品': 'M0000661',
};
// PPI分项环比Wind ID （同一指标但ID不同）
const SUB_ITEM_MOM_IDS: Record<string, string> = {
  'PPI总指数': 'M0000707',
  '采掘工业': 'M0000662',
  '原材料工业': 'M0000663',
  '加工工业': 'M0000664',
  '食品': 'M0000665',
  '衣着': 'M0000666',
  '一般日用品': 'M0000667',
  '耐用消费品': 'M0000668',
};

const INDUSTRY_MINING = ['煤炭采选', '油气开采', '黑金采选', '非金矿采选', '有色采选'];
const INDUSTRY_MATERIAL = ['黑金冶炼', '有色冶炼', '化学原料及制品', '化纤制造', '油煤加工', '非金矿制品'];
const INDUSTRY_MID_MFG = ['金属制品', '橡塑制造', '木材加工制造', '造纸制品', '通用设备制造', '运输设备制造', '汽车制造', '电子设备制造'];
const INDUSTRY_CONSUMER = ['农副食品加工', '食品制造', '酒饮茶制造', '纺织服装', '烟草制品'];
const INDUSTRY_UTILITY = ['电热生产供应', '燃气生产供应', '水生产供应'];
const INDUSTRY_NAMES = [...INDUSTRY_MINING, ...INDUSTRY_MATERIAL, ...INDUSTRY_MID_MFG, ...INDUSTRY_CONSUMER, ...INDUSTRY_UTILITY];

// PPI分行业Wind ID映射（来源：万得 Wind）
const INDUSTRY_YOY_IDS: Record<string, string> = {
  '煤炭采选': 'M0001314', '油气开采': 'M0001315', '黑金采选': 'M0001316', '非金矿采选': 'M0001318', '有色采选': 'M0001317',
  '黑金冶炼': 'M0001339', '有色冶炼': 'M0001340', '化学原料及制品': 'M0001333', '化纤制造': 'M0001335', '油煤加工': 'M0001332', '非金矿制品': 'M0001338',
  '金属制品': 'M0001341', '橡塑制造': 'M0096833', '木材加工制造': 'M0001327', '造纸制品': 'M0001329',
  '通用设备制造': 'M0001342', '运输设备制造': 'M0001344', '汽车制造': 'M0096839', '电子设备制造': 'M0001346',
  '农副食品加工': 'M0001320', '食品制造': 'M0001321', '酒饮茶制造': 'M0001322', '纺织服装': 'M0001325', '烟草制品': 'M0001323',
  '电热生产供应': 'M0001350', '燃气生产供应': 'M0001351', '水生产供应': 'M0001352',
};
const INDUSTRY_MOM_IDS: Record<string, string> = {
  '煤炭采选': 'M0096793', '油气开采': 'M0096794', '黑金采选': 'M0096795', '非金矿采选': 'M0096797', '有色采选': 'M0096796',
  '黑金冶炼': 'M0096816', '有色冶炼': 'M0096817', '化学原料及制品': 'M0096812', '化纤制造': 'M0096814', '油煤加工': 'M0096811', '非金矿制品': 'M0096815',
  '金属制品': 'M0096818', '橡塑制造': 'M0096835', '木材加工制造': 'M0096806', '造纸制品': 'M0096808',
  '通用设备制造': 'M0096819', '运输设备制造': 'M0096821', '汽车制造': 'M0096841', '电子设备制造': 'M0096823',
  '农副食品加工': 'M0096799', '食品制造': 'M0096800', '酒饮茶制造': 'M0096801', '纺织服装': 'M0096804', '烟草制品': 'M0096802',
  '电热生产供应': 'M0096827', '燃气生产供应': 'M0096828', '水生产供应': 'M0096829',
};

// 热力图背景色：>0红色系（绝对值越大越深），<0绿色系（绝对值越大越深），=0灰色
function getHeatBgColor(value: number): string {
  if (value === 0) return '#d1d5db';
  if (value > 0) {
    const intensity = Math.min(Math.abs(value) / 4, 1);
    if (intensity < 0.15) return '#fee2e2';
    if (intensity < 0.30) return '#fecaca';
    if (intensity < 0.45) return '#fca5a5';
    if (intensity < 0.60) return '#f87171';
    if (intensity < 0.80) return '#ef4444';
    return '#b91c1c';
  }
  const intensity = Math.min(Math.abs(value) / 4, 1);
  if (intensity < 0.15) return '#dcfce7';
  if (intensity < 0.30) return '#bbf7d0';
  if (intensity < 0.45) return '#86efac';
  if (intensity < 0.60) return '#4ade80';
  if (intensity < 0.80) return '#22c55e';
  return '#15803d';
}

function getHeatTextColor(value: number): string {
  if (value === 0) return '#374151';
  const intensity = Math.min(Math.abs(value) / 4, 1);
  return intensity > 0.60 ? '#ffffff' : '#1f2937';
}

const productionNames = ['PPI总指数', '采掘工业', '原材料工业', '加工工业'];
const consumptionNames = ['食品', '衣着', '一般日用品', '耐用消费品'];
const industryNames = INDUSTRY_NAMES;

// 从真实数据源获取表格行数据
function getTableData(
  names: string[],
  monthsArr: string[],
  viewType: 'yoy' | 'mom',
  dataSource: 'item' | 'industry'
): { name: string; values: number[] }[] {
  const source = viewType === 'yoy'
    ? (dataSource === 'item' ? ppiSubItemYoyReal : ppiIndustryYoyReal)
    : (dataSource === 'item' ? ppiSubItemMomReal : ppiIndustryMomReal);

  return names.map(name => ({
    name,
    values: monthsArr.map(m => {
      const monthData = source[m];
      if (!monthData) return 0;
      const val = monthData[name];
      return val !== undefined ? Number(val.toFixed(2)) : 0;
    }),
  }));
}

function handleSortClick(
  month: string,
  currentSortBy: string | null,
  currentSortDir: 'asc' | 'desc',
  setSortBy: (v: string | null) => void,
  setSortDir: (v: 'asc' | 'desc') => void
) {
  if (currentSortBy === month) {
    setSortDir(currentSortDir === 'asc' ? 'desc' : 'asc');
  } else {
    setSortBy(month);
    setSortDir('desc');
  }
}

function sortTableData(
  rows: { name: string; values: number[] }[],
  sortColIdx: number,
  sortDir: 'asc' | 'desc'
): { name: string; values: number[] }[] {
  return [...rows].sort((a, b) =>
    sortDir === 'desc'
      ? b.values[sortColIdx] - a.values[sortColIdx]
      : a.values[sortColIdx] - b.values[sortColIdx]
  );
}

export function PPIModule() {
  const dr1 = useChartDateRange(2011, 1);
  const dr2 = useChartDateRange(2024, 4);
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1.startStr, dr1.endStr]);
  const [s2, e2] = useMemo(() => getIndexRange(months, dr2.startStr, dr2.endStr), [dr2.startStr, dr2.endStr]);
  const fm1 = useMemo(() => months.slice(s1, e1), [s1, e1]);
  const fm2 = useMemo(() => months.slice(s2, e2), [s2, e2]);
  const ppiYoyData = useMemo(() => blankUnpublished(fm1, ppiData.yoy.slice(s1, e1), 'ppi'), [fm1, s1, e1]);
  const ppiMomData = useMemo(() => blankUnpublished(fm2, ppiData.mom.slice(s2, e2), 'ppi'), [fm2, s2, e2]);

  // 近12个月用于热力图
  const recentEnd = getPrevMonthIndex() + 1;
  const recentStart = Math.max(recentEnd - 12, 0);
  const recentMonths = useMemo(() => months.slice(recentStart, recentEnd), []);

  // 视图类型和排序
  const [itemView, setItemView] = useState<'yoy' | 'mom'>('yoy');
  const [industryView, setIndustryView] = useState<'yoy' | 'mom'>('yoy');
  const [itemSortBy, setItemSortBy] = useState<string | null>(null);
  const [itemSortDir, setItemSortDir] = useState<'asc' | 'desc'>('desc');
  const [industrySortBy, setIndustrySortBy] = useState<string | null>(null);
  const [industrySortDir, setIndustrySortDir] = useState<'asc' | 'desc'>('desc');

  const prodTableData = useMemo(
    () => getTableData(productionNames, recentMonths, itemView, 'item'),
    [recentMonths, itemView]
  );
  const consTableData = useMemo(
    () => getTableData(consumptionNames, recentMonths, itemView, 'item'),
    [recentMonths, itemView]
  );
  const industryTableData = useMemo(
    () => getTableData(industryNames, recentMonths, industryView, 'industry'),
    [recentMonths, industryView]
  );

const industryDataCache = useMemo(() => {
    const byName: Record<string, { name: string; values: number[] }> = {};
    for (const name of INDUSTRY_NAMES) {
      const rows = getTableData([name], recentMonths, industryView, 'industry');
      if (rows.length > 0) byName[name] = rows[0];
    }
    return byName;
  }, [recentMonths, industryView]);

  const INDUSTRY_GROUPS = [
    { title: '采矿业', names: INDUSTRY_MINING, color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
    { title: '原材料冶炼加工', names: INDUSTRY_MATERIAL, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    { title: '中间品与装备制造', names: INDUSTRY_MID_MFG, color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
    { title: '消费品制造', names: INDUSTRY_CONSUMER, color: '#92400e', bg: '#fef3c7', border: '#fde68a' },
    { title: '公用事业', names: INDUSTRY_UTILITY, color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  ];

  const sortedIndustryTable = useMemo(() => {
    if (!industrySortBy) return industryTableData;
    const colIdx = recentMonths.indexOf(industrySortBy);
    if (colIdx < 0) return industryTableData;
    return sortTableData(industryTableData, colIdx, industrySortDir);
  }, [industryTableData, industrySortBy, industrySortDir, recentMonths]);

  // HTML热力表格组件
  const HeatTable = ({ rows, sortBy, sortDir, onSort, windIdMapYoy, windIdMapMom, viewType }: {
    rows: { name: string; values: number[] }[];
    sortBy: string | null;
    sortDir: 'asc' | 'desc';
    onSort: (month: string) => void;
    windIdMapYoy?: Record<string, string>;
    windIdMapMom?: Record<string, string>;
    viewType?: 'yoy' | 'mom';
  }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-[#f8fafc]">
            <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">
              项目
            </th>
            {recentMonths.map(m => {
              const isActive = sortBy === m;
              return (
                <th
                  key={m}
                  className="border border-[#e2e8f0] px-1.5 py-1.5 text-center text-[#475569] font-semibold min-w-[52px] cursor-pointer hover:bg-[#e2e8f0] select-none"
                  onClick={() => onSort(m)}
                >
                  <span className="inline-flex items-center gap-0.5">
                    {m.slice(2)}
                    <span className="text-[9px] leading-none">
                      {isActive ? (sortDir === 'desc' ? '▼' : '▲') : '⇅'}
                    </span>
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row.name} className={ri % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
              <td className="border border-[#e2e8f0] px-2 py-1 text-[#334155] font-medium sticky left-0 bg-inherit">
                <WindIdHover id={viewType === 'mom' ? (windIdMapMom?.[row.name] ?? '') : (windIdMapYoy?.[row.name] ?? '')}>{row.name}</WindIdHover>
              </td>
              {row.values.map((v, ci) => (
                <td
                  key={ci}
                  className="border border-[#e2e8f0] px-1 py-1 text-center tabular-nums"
                  style={{
                    backgroundColor: getHeatBgColor(v),
                    color: getHeatTextColor(v),
                  }}
                >
                  {v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* PPI同比 */}
      <ChartCard title={<WindIdHover id="M0000610">PPI同比</WindIdHover>} subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.ppi} | 同比:M0000610 环比:M0000707`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [{ type: 'line', data: ppiYoyData, smooth: true, lineStyle: { color: '#ef4444', width: 2 }, itemStyle: { color: '#ef4444' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(239,68,68,0.15)' }, { offset: 1, color: 'rgba(239,68,68,0)' }] } }, symbol: 'circle', symbolSize: 3 }],
          animationDuration: 500,
        }} style={{ height: 360 }} />
      </ChartCard>

      {/* PPI环比 */}
      <ChartCard title={<WindIdHover id="M0000707">PPI环比</WindIdHover>} subtitle={`${dr2.startStr} ~ ${dr2.endStr} | ${DATA_SOURCES.ppi}`} dateRange={dr2}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm2, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [{
            type: 'bar', data: ppiMomData,
            itemStyle: { color: (p: any) => p.value >= 0 ? 'rgba(239,68,68,0.7)' : 'rgba(34,197,94,0.7)', borderRadius: [3, 3, 0, 0] },
            barWidth: '60%',
          }],
          animationDuration: 500,
        }} style={{ height: 360 }} />
      </ChartCard>

      {/* PPI细分项变动热力图 — 生产资料 + 生活资料 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[#f1f5f9]">
          <div>
            <h3 className="text-sm font-semibold text-[#1e293b]">PPI细分项变动热力图（近12个月{itemView === 'yoy' ? '同比' : '环比'}）</h3>
            <p className="text-[10px] text-[#94a3b8]">{DATA_SOURCES.ppi} | 同比ID:M0000610 环比ID:M0000707</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              <button onClick={() => setItemView('yoy')} className={`px-2 py-0.5 text-[10px] rounded ${itemView === 'yoy' ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>同比</button>
              <button onClick={() => setItemView('mom')} className={`px-2 py-0.5 text-[10px] rounded ${itemView === 'mom' ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>环比</button>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">项目</th>
                  {recentMonths.map(m => {
                    const isActive = itemSortBy === m;
                    return (
                      <th key={m} className="border border-[#e2e8f0] px-1.5 py-1.5 text-center text-[#475569] font-semibold min-w-[52px] cursor-pointer hover:bg-[#e2e8f0] select-none"
                        onClick={() => { if (itemSortBy === m) setItemSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setItemSortBy(m); setItemSortDir('desc'); } }}>
                        <span className="inline-flex items-center gap-0.5">{m.slice(2)}<span className="text-[9px] leading-none">{isActive ? (itemSortDir === 'desc' ? '▼' : '▲') : '⇅'}</span></span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {/* 生产资料标题行 */}
                <tr className="bg-[#eff6ff]">
                  <td colSpan={recentMonths.length + 1} className="px-2 py-1.5 text-xs font-semibold text-[#1e40af] border border-[#bfdbfe]">生产资料</td>
                </tr>
                {(itemSortBy ? sortTableData(prodTableData, recentMonths.indexOf(itemSortBy) >= 0 ? recentMonths.indexOf(itemSortBy) : 0, itemSortDir) : prodTableData).map((row, ri) => (
                  <tr key={row.name} className={ri % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                    <td className="border border-[#e2e8f0] px-2 py-1 text-[#334155] font-medium sticky left-0 bg-inherit">
                      <WindIdHover id={itemView === 'mom' ? (SUB_ITEM_MOM_IDS[row.name] ?? '') : (SUB_ITEM_YOY_IDS[row.name] ?? '')}>{row.name}</WindIdHover>
                    </td>
                    {row.values.map((v, ci) => (
                      <td key={ci} className="border border-[#e2e8f0] px-1 py-1 text-center tabular-nums"
                        style={{ backgroundColor: getHeatBgColor(v), color: getHeatTextColor(v) }}>
                        {v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* 生活资料标题行 */}
                <tr className="bg-[#fef3c7]">
                  <td colSpan={recentMonths.length + 1} className="px-2 py-1.5 text-xs font-semibold text-[#92400e] border border-[#fde68a]">生活资料</td>
                </tr>
                {(itemSortBy ? sortTableData(consTableData, recentMonths.indexOf(itemSortBy) >= 0 ? recentMonths.indexOf(itemSortBy) : 0, itemSortDir) : consTableData).map((row, ri) => (
                  <tr key={row.name} className={ri % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                    <td className="border border-[#e2e8f0] px-2 py-1 text-[#334155] font-medium sticky left-0 bg-inherit">
                      <WindIdHover id={itemView === 'mom' ? (SUB_ITEM_MOM_IDS[row.name] ?? '') : (SUB_ITEM_YOY_IDS[row.name] ?? '')}>{row.name}</WindIdHover>
                    </td>
                    {row.values.map((v, ci) => (
                      <td key={ci} className="border border-[#e2e8f0] px-1 py-1 text-center tabular-nums"
                        style={{ backgroundColor: getHeatBgColor(v), color: getHeatTextColor(v) }}>
                        {v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PPI分行业出厂价格变动热力图 — 按上下游分组 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[#f1f5f9]">
          <div>
            <h3 className="text-sm font-semibold text-[#1e293b]">PPI分行业出厂价格变动热力图（近12个月{industryView === 'yoy' ? '同比' : '环比'}）</h3>
            <p className="text-[10px] text-[#94a3b8]">{DATA_SOURCES.ppi} | 同比ID:M0000610 环比ID:M0000707</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              <button onClick={() => setIndustryView('yoy')} className={`px-2 py-0.5 text-[10px] rounded ${industryView === 'yoy' ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>同比</button>
              <button onClick={() => setIndustryView('mom')} className={`px-2 py-0.5 text-[10px] rounded ${industryView === 'mom' ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>环比</button>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">行业</th>
                  {recentMonths.map(m => {
                    const isActive = industrySortBy === m;
                    return (
                      <th key={m} className="border border-[#e2e8f0] px-1.5 py-1.5 text-center text-[#475569] font-semibold min-w-[52px] cursor-pointer hover:bg-[#e2e8f0] select-none"
                        onClick={() => { if (industrySortBy === m) setIndustrySortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setIndustrySortBy(m); setIndustrySortDir('desc'); } }}>
                        <span className="inline-flex items-center gap-0.5">{m.slice(2)}<span className="text-[9px] leading-none">{isActive ? (industrySortDir === 'desc' ? '▼' : '▲') : '⇅'}</span></span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {INDUSTRY_GROUPS.map(group => {
                  const colIdx = industrySortBy && recentMonths.indexOf(industrySortBy) >= 0 ? recentMonths.indexOf(industrySortBy) : 0;
                  const sorted = sortTableData(
                    group.names.map(name => industryDataCache[name]).filter(Boolean),
                    colIdx, industrySortDir
                  );
                  return (
                    <Fragment key={group.title}>
                      <tr style={{ backgroundColor: group.bg }}>
                        <td colSpan={recentMonths.length + 1} className="px-2 py-1.5 text-xs font-semibold border" style={{ color: group.color, borderColor: group.border }}>
                          {group.title}
                        </td>
                      </tr>
                      {sorted.map((row, ri) => (
                        <tr key={row.name} className={ri % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                          <td className="border border-[#e2e8f0] px-2 py-1 text-[#334155] font-medium sticky left-0 bg-inherit">
                            <WindIdHover id={industryView === 'mom' ? (INDUSTRY_MOM_IDS[row.name] ?? '') : (INDUSTRY_YOY_IDS[row.name] ?? '')}>{row.name}</WindIdHover>
                          </td>
                          {row.values.map((v, ci) => (
                            <td key={ci} className="border border-[#e2e8f0] px-1 py-1 text-center tabular-nums"
                              style={{ backgroundColor: getHeatBgColor(v), color: getHeatTextColor(v) }}>
                              {v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 指标说明 - 放在页面最下方 */}
      <IndicatorExplanation
        title="PPI（工业生产者出厂价格指数）指标说明"
        items={[
          { label: '指标定义', content: 'PPI是衡量工业企业产品出厂价格变动趋势和程度的指数，反映生产领域价格变动情况。' },
          { label: '计算方式', content: '通过全国5万余家工业企业调查，采用拉氏指数公式计算，基期为2010年。' },
          { label: '数据来源', content: '国家统计局（www.stats.gov.cn），每月9-10日公布上月数据。' },
          { label: '指标意义', content: 'PPI是通胀先行指标，上游价格变化会传导至CPI。持续负增长可能预示通缩压力。' },
        ]}
      />
    </div>
  );
}

export default PPIModule;
