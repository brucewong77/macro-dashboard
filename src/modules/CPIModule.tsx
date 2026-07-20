import { useMemo, useState, useEffect } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, cpiData, getIndexRange, blankUnpublished } from '../data/economicData';
import { cpiYoyReal, cpiMomReal, DATA_SOURCES } from '../data/realData';
import { getCpiData } from '../data/api';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';
import { WindIdHover } from '../components/WindIdHover';
import { subCpiData, eightMajorCpiData } from '../data/cpiExcelData';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

/* ─── CPI 细分项 → Wind ID ─── */
function cpiSubWindId(name: string): string {
  const map: Record<string, string> = {
    '城市CPI': 'M0000783', '农村CPI': 'M0000909',
    '食品': 'M0000616', '非食品': 'M0000613',
    '消费品': 'M0000614', '服务': 'M0000615',
    '核心CPI': 'M0085932',
  };
  return map[name] ?? '';
}
function cpiSubMomWindId(name: string): string {
  const map: Record<string, string> = {
    '城市CPI': 'M0000831', '农村CPI': 'M0000957',
    '食品': 'M0000706', '非食品': 'M0061581',
    '消费品': 'M0061583', '服务': 'M0061585',
    '核心CPI': 'M0085934',
  };
  return map[name] ?? '';
}
function cpiMajorWindId(name: string): string {
  const map: Record<string, string> = {
    '食品烟酒': 'M0327903', '衣着': 'M0000628', '居住': 'M0000650',
    '生活用品及服务': 'M0000630', '交通和通信': 'M0000637',
    '教育文化和娱乐': 'M0000644', '医疗保健': 'M0000633',
    '其他用品和服务': 'M0327904',
  };
  return map[name] ?? '';
}
function cpiMajorMomWindId(name: string): string {
  const map: Record<string, string> = {
    '食品烟酒': 'M0327907', '衣着': 'M0000708', '居住': 'M0000713',
    '生活用品及服务': 'M0000709', '交通和通信': 'M0000711',
    '教育文化和娱乐': 'M0000712', '医疗保健': 'M0000710',
    '其他用品和服务': 'M0327908',
  };
  return map[name] ?? '';
}
/* ─── CPI 八大类细分项 → Wind ID（同比） ─── */
function cpiDetailWindId(cat: string, sub: string): string {
  const map: Record<string, string> = {
    '食品烟酒:鲜菜': 'M0000622', '食品烟酒:粮食': 'M0000617',
    '食品烟酒:畜肉类': 'M0000619', '食品烟酒:食用油': 'M0000618',
    '食品烟酒:猪肉': 'M0044542', '食品烟酒:牛肉': 'M0085936',
    '食品烟酒:羊肉': 'M0085940', '食品烟酒:水产品': 'M0000621',
    '食品烟酒:蛋类': 'M0000620', '食品烟酒:奶类': 'M0068161',
    '食品烟酒:鲜果': 'M0000623', '食品烟酒:酒类': 'M0000627',
    '衣着:服装': 'M0000629', '衣着:鞋类': 'M0068162',
    '居住:租赁房房租': 'M0000653', '居住:水电燃料': 'M0000651',
    '生活用品及服务:家庭服务': 'M0000632', '生活用品及服务:家用器具': 'M0000631',
    '交通和通信:小汽车': 'M0000638', '交通和通信:交通工具用能源': 'M0000639',
    '教育文化和娱乐:教育服务': 'M0068164', '教育文化和娱乐:旅行社及其他旅游服务': 'M0000647',
    '医疗保健:中药': 'M0000635', '医疗保健:西药': 'M0000634',
    '医疗保健:医疗服务': 'M0000636',
  };
  return map[`${cat}:${sub}`] ?? '';
}
/* ─── CPI 八大类细分项 → Wind ID（环比） ─── */
function cpiDetailMomWindId(cat: string, sub: string): string {
  const map: Record<string, string> = {
    '食品烟酒:鲜菜': 'M0062910', '食品烟酒:粮食': 'M0062906',
    '食品烟酒:畜肉类': 'M0062907', '食品烟酒:食用油': 'M0068106',
    '食品烟酒:猪肉': 'M0068107', '食品烟酒:牛肉': 'M0085938',
    '食品烟酒:羊肉': 'M0085942', '食品烟酒:水产品': 'M0062909',
    '食品烟酒:蛋类': 'M0062908', '食品烟酒:奶类': 'M0068169',
    '食品烟酒:鲜果': 'M0062911', '食品烟酒:酒类': 'M0068109',
    '衣着:服装': 'M0068110', '衣着:鞋类': 'M0068170',
    '居住:租赁房房租': 'M0068121', '居住:水电燃料': 'M0068122',
    '生活用品及服务:家庭服务': 'M0068112', '生活用品及服务:家用器具': 'M0068111',
    '交通和通信:小汽车': 'M0327927', '交通和通信:交通工具用能源': 'M0068116',
    '教育文化和娱乐:教育服务': 'M0068172', '教育文化和娱乐:旅行社及其他旅游服务': 'M0068119',
    '医疗保健:中药': 'M0068113', '医疗保健:西药': 'M0068114',
    '医疗保健:医疗服务': 'M0068115',
  };
  return map[`${cat}:${sub}`] ?? '';
}

/* ─────────── 色阶函数 ─────────── */
function getHeatColor(value: number): string {
  if (Math.abs(value) < 0.05) return '#f1f5f9';
  if (value > 0) {
    const t = Math.min(value / 5, 1);
    if (t < 0.2) return '#fee2e2';
    if (t < 0.4) return '#fecaca';
    if (t < 0.6) return '#fca5a5';
    if (t < 0.8) return '#f87171';
    return '#ef4444';
  }
  const t = Math.min(Math.abs(value) / 5, 1);
  if (t < 0.2) return '#dcfce7';
  if (t < 0.4) return '#bbf7d0';
  if (t < 0.6) return '#86efac';
  if (t < 0.8) return '#4ade80';
  return '#22c55e';
}

/* 值得趋势指示器 */
function trendIcon(v: number) {
  if (v > 0.3) return <TrendingUp className="inline-block w-3 h-3 text-red-500" />;
  if (v < -0.3) return <TrendingDown className="inline-block w-3 h-3 text-green-500" />;
  return <Minus className="inline-block w-3 h-3 text-gray-400" />;
}

/* ─────────── 格式化值 ─────────── */
function fmt(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  const s = v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1);
  return s;
}

/* ─────────── 表格通用样式类 ─────────── */
const cellClass =
  'border-r border-[#e2e8f0] px-2 py-1.5 text-xs text-center tabular-nums font-mono';
const headerCellClass =
  'border-r border-[#e2e8f0] px-1.5 py-1.5 text-xs text-center font-semibold text-[#475569]';
const stickyColClass =
  'sticky left-0 z-10 bg-white border-r-2 border-[#cbd5e1] px-3 py-1.5 text-xs font-semibold text-[#334155]';

/* ─────────── 主组件 ─────────── */
export function CPIModule() {
  const drYoy = useChartDateRange(2011, 1);
  const drMom = useChartDateRange(2024, 4);
  const drCoreYoy = useChartDateRange(2011, 1);
  const drCoreMom = useChartDateRange(2024, 4);
  const [sYoy, eYoy] = useMemo(
    () => getIndexRange(months, drYoy.startStr, drYoy.endStr),
    [drYoy.startStr, drYoy.endStr],
  );
  const [sMom, eMom] = useMemo(
    () => getIndexRange(months, drMom.startStr, drMom.endStr),
    [drMom.startStr, drMom.endStr],
  );
  const [sCoreYoy, eCoreYoy] = useMemo(
    () => getIndexRange(months, drCoreYoy.startStr, drCoreYoy.endStr),
    [drCoreYoy.startStr, drCoreYoy.endStr],
  );
  const [sCoreMom, eCoreMom] = useMemo(
    () => getIndexRange(months, drCoreMom.startStr, drCoreMom.endStr),
    [drCoreMom.startStr, drCoreMom.endStr],
  );
  const fmYoy = useMemo(() => months.slice(sYoy, eYoy), [sYoy, eYoy]);
  const fmMom = useMemo(() => months.slice(sMom, eMom), [sMom, eMom]);
  const fmCoreYoy = useMemo(() => months.slice(sCoreYoy, eCoreYoy), [sCoreYoy, eCoreYoy]);
  const fmCoreMom = useMemo(() => months.slice(sCoreMom, eCoreMom), [sCoreMom, eCoreMom]);
  const cpiYoyData = useMemo(
    () => blankUnpublished(fmYoy, cpiData.yoy.slice(sYoy, eYoy), 'cpi'),
    [fmYoy, sYoy, eYoy],
  );
  const cpiMomData = useMemo(
    () => blankUnpublished(fmMom, cpiData.mom.slice(sMom, eMom), 'cpi'),
    [fmMom, sMom, eMom],
  );
  const cpiCoreYoyData = useMemo(
    () => blankUnpublished(fmCoreYoy, cpiData.coreYoy.slice(sCoreYoy, eCoreYoy), 'cpi'),
    [fmCoreYoy, sCoreYoy, eCoreYoy],
  );
  const cpiCoreMomData = useMemo(
    () => blankUnpublished(fmCoreMom, cpiData.coreMom.slice(sCoreMom, eCoreMom), 'cpi'),
    [fmCoreMom, sCoreMom, eCoreMom],
  );

  const [subView, setSubView] = useState<'yoy' | 'mom'>('yoy');
  const [detailView, setDetailView] = useState<'yoy' | 'mom'>('yoy');
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  // 行业表排序
  const [majorSortCol, setMajorSortCol] = useState<string | null>(null);
  const [majorSortDir, setMajorSortDir] = useState<'asc' | 'desc'>('desc');

  // 最新月份 index
  const latestIdx = subCpiData.months.length - 1;
  const latestMonth = subCpiData.months[0]; // 最新月份

  // 远程AI点评
  const [remoteAnalysis, setRemoteAnalysis] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getCpiData()
      .then((data) => {
        if (!cancelled) {
          const a = (data as any).remoteAnalysis;
          if (a) setRemoteAnalysis(a);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  /* ─── 排序函数 ─── */
  function sortRowsByMonth<T extends { name: string; values: Record<string, number> }>(
    rows: T[],
    month: string | null,
    dir: 'asc' | 'desc',
  ): T[] {
    if (!month) return rows;
    return [...rows].sort((a, b) => {
      const va = a.values[month] ?? 0;
      const vb = b.values[month] ?? 0;
      return dir === 'desc' ? vb - va : va - vb;
    });
  }

  /* ─── 细分CPI数据（按组划分） ─── */
  const SUB_GROUPS = [
    { label: '城乡CPI', color: '#2563eb', items: ['城市CPI', '农村CPI'] },
    { label: '食品与非食品', color: '#7c3aed', items: ['食品', '非食品'] },
    { label: '消费品与服务', color: '#0891b2', items: ['消费品', '服务'] },
    { label: '核心CPI', color: '#be123c', items: ['核心CPI'] },
  ];

  const subRows = useMemo(() => {
    return subCpiData.items.map((item) => ({
      name: item.name,
      values: subCpiData.months.reduce(
        (acc, m) => {
          acc[m] = subView === 'yoy' ? item.yoy[m] : item.mom[m];
          return acc;
        },
        {} as Record<string, number>,
      ),
    }));
  }, [subView]);

  const groupedSubRows = useMemo(() => {
    const nameToRow = new Map(subRows.map((r) => [r.name, r]));
    const result: ({ type: 'group'; label: string; color: string } | { type: 'item'; row: typeof subRows[0] })[] = [];
    for (const g of SUB_GROUPS) {
      result.push({ type: 'group', label: g.label, color: g.color });
      for (const name of g.items) {
        const row = nameToRow.get(name);
        if (row) result.push({ type: 'item', row });
      }
    }
    return result;
  }, [subRows]);

  /* ─── 行业CPI数据 ─── */
  const majorRows = useMemo(() => {
    return eightMajorCpiData.categories.map((cat) => ({
      name: cat.name,
      values: eightMajorCpiData.months.reduce(
        (acc, m) => {
          acc[m] = detailView === 'yoy' ? cat.yoy[m] : cat.mom[m];
          return acc;
        },
        {} as Record<string, number>,
      ),
      subs: cat.subs.map((sub) => ({
        name: sub.name,
        values: eightMajorCpiData.months.reduce(
          (acc, m) => {
            acc[m] = detailView === 'yoy' ? sub.yoy[m] : sub.mom[m];
            return acc;
          },
          {} as Record<string, number>,
        ),
      })),
    }));
  }, [detailView]);

  const sortedMajorRows = useMemo(
    () => sortRowsByMonth(majorRows, majorSortCol, majorSortDir),
    [majorRows, majorSortCol, majorSortDir],
  );

  /* ─── 排序点击 ─── */
  function handleMajorSort(m: string) {
    if (majorSortCol === m) setMajorSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setMajorSortCol(m);
      setMajorSortDir('desc');
    }
  }

  /* ─── 最新一期汇总卡片 ─── */
  function LatestSummary() {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {subCpiData.items.slice(0, 4).map((item) => {
          const yv = item.yoy[latestMonth];
          const mv = item.mom[latestMonth];
          return (
            <div
              key={item.name}
              className="bg-white rounded-lg border border-[#e2e8f0] p-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-[10px] uppercase tracking-wider text-[#94a3b8] mb-1">
                <WindIdHover id={cpiSubWindId(item.name)}>{item.name}</WindIdHover>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] text-[#94a3b8]">同比</span>
                <span className="text-[10px] text-[#94a3b8] font-mono"><WindIdHover id={cpiSubWindId(item.name)} /></span>
                <span
                  className={`text-lg font-bold tabular-nums ${
                    yv > 0 ? 'text-red-600' : yv < 0 ? 'text-green-600' : 'text-gray-600'
                  }`}
                >
                  {yv > 0 ? '+' : ''}
                  {yv?.toFixed(1) ?? '—'}%
                </span>
                <span className="text-[11px] text-[#94a3b8]">/</span>
                <span className="text-[10px] text-[#94a3b8]">环比</span>
                <span className="text-[10px] text-[#94a3b8] font-mono"><WindIdHover id={cpiSubMomWindId(item.name)} /></span>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    mv > 0 ? 'text-red-500' : mv < 0 ? 'text-green-500' : 'text-gray-500'
                  }`}
                >
                  {mv > 0 ? '+' : ''}
                  {mv?.toFixed(1) ?? '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ─── 表格列头 ─── */
  function renderMonthHeaders(
    monthList: string[],
    sortCol: string | null,
    sortDir: 'asc' | 'desc',
    onSort: (m: string) => void,
  ) {
    return monthList.map((m, i) => (
      <th
        key={m}
        className={`${headerCellClass} min-w-[56px] cursor-pointer hover:bg-[#e2e8f0] select-none transition-colors`}
        onClick={() => onSort(m)}
      >
        <span className="inline-flex items-center gap-0.5">
          {m.slice(2)}
          <span className="text-[8px] leading-none opacity-60">
            {sortCol === m ? (sortDir === 'desc' ? '▼' : '▲') : '⇅'}
          </span>
        </span>
      </th>
    ));
  }

  return (
    <div className="space-y-5">
      {/* 数据点评卡片 */}
      {remoteAnalysis && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#1e293b] mb-2 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-blue-500 rounded-full inline-block" />
            CPI 数据点评
          </h3>
          <p className="text-sm text-[#475569] leading-relaxed">{remoteAnalysis}</p>
        </div>
      )}

      {/* 最新一期速览 */}
      <ChartCard title="最新CPI速览">
        <LatestSummary />
      </ChartCard>

      {/* CPI同比 & 核心CPI同比（合并） */}
      {/* CPI同比 & 核心CPI同比（合并） */}
      <ChartCard
        title="CPI同比 & 核心CPI同比"
        subtitle={`${drYoy.startStr} ~ ${drYoy.endStr} | ${DATA_SOURCES.cpi} | 同比:M0000616 核心同比:M0085932`}
        dateRange={drYoy}
      >
        <ReactECharts
          option={{
            tooltip: {
              trigger: 'axis' as const,
              backgroundColor: 'rgba(255,255,255,0.96)',
              borderColor: '#e2e8f0',
              textStyle: { color: '#1e293b' },
            },
            legend: {
              data: ['CPI同比', '核心CPI同比'],
              bottom: 0,
              textStyle: { color: '#64748b', fontSize: 11 },
            },
            grid: { top: 10, right: 20, bottom: 40, left: 50 },
            xAxis: {
              type: 'category',
              data: fmYoy,
              axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 },
              axisLine: { lineStyle: { color: '#e2e8f0' } },
            },
            yAxis: {
              type: 'value',
              name: '%',
              nameTextStyle: { color: '#94a3b8', fontSize: 10 },
              axisLabel: { color: '#94a3b8', fontSize: 10 },
              splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } },
            },
            series: [
              {
                name: 'CPI同比',
                type: 'line',
                data: cpiYoyData,
                smooth: true,
                lineStyle: { color: '#ef4444', width: 2 },
                itemStyle: { color: '#ef4444' },
                areaStyle: {
                  color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: 'rgba(239,68,68,0.15)' },
                      { offset: 1, color: 'rgba(239,68,68,0)' },
                    ],
                  },
                },
                symbol: 'circle',
                symbolSize: 3,
              },
              {
                name: '核心CPI同比',
                type: 'line',
                data: cpiCoreYoyData,
                smooth: true,
                lineStyle: { color: '#8b5cf6', width: 2 },
                itemStyle: { color: '#8b5cf6' },
                areaStyle: {
                  color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                      { offset: 0, color: 'rgba(139,92,246,0.12)' },
                      { offset: 1, color: 'rgba(139,92,246,0)' },
                    ],
                  },
                },
                symbol: 'diamond',
                symbolSize: 3,
              },
            ],
            animationDuration: 500,
          }}
          style={{ height: 360 }}
        />
      </ChartCard>

      {/* CPI环比 & 核心CPI环比（合并） */}
      <ChartCard
        title="CPI环比 & 核心CPI环比"
        subtitle={`${drMom.startStr} ~ ${drMom.endStr} | ${DATA_SOURCES.cpi} | 环比:M0000706 核心环比:M0085934`}
        dateRange={drMom}
      >
        <ReactECharts
          option={{
            tooltip: {
              trigger: 'axis' as const,
              backgroundColor: 'rgba(255,255,255,0.96)',
              borderColor: '#e2e8f0',
              textStyle: { color: '#1e293b' },
            },
            legend: {
              data: ['CPI环比', '核心CPI环比'],
              bottom: 0,
              textStyle: { color: '#64748b', fontSize: 11 },
            },
            grid: { top: 10, right: 20, bottom: 40, left: 50 },
            xAxis: {
              type: 'category',
              data: fmMom,
              axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 },
              axisLine: { lineStyle: { color: '#e2e8f0' } },
            },
            yAxis: {
              type: 'value',
              name: '%',
              nameTextStyle: { color: '#94a3b8', fontSize: 10 },
              axisLabel: { color: '#94a3b8', fontSize: 10 },
              splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } },
            },
            series: [
              {
                name: 'CPI环比',
                type: 'bar',
                data: cpiMomData,
                itemStyle: {
                  color: 'rgba(239,68,68,0.8)',
                  borderRadius: [3, 3, 0, 0],
                },
                barWidth: '28%',
                barGap: '10%',
              },
              {
                name: '核心CPI环比',
                type: 'bar',
                data: cpiCoreMomData,
                itemStyle: {
                  color: 'rgba(139,92,246,0.8)',
                  borderRadius: [3, 3, 0, 0],
                },
                barWidth: '28%',
              },
            ],
            animationDuration: 500,
          }}
          style={{ height: 360 }}
        />
      </ChartCard>

      {/* ============================
          细分CPI表现情况
          ============================ */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
          <div>
            <h3 className="text-sm font-bold text-[#1e293b]">
              细分CPI表现情况
            </h3>
            <p className="text-[11px] text-[#94a3b8] mt-0.5">
              数据来源：Wind（来源：细分CPI.xlsx）
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748b]">视图：</span>
            <div className="flex gap-0.5 bg-[#f1f5f9] rounded-lg p-0.5">
              <button
                onClick={() => setSubView('yoy')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  subView === 'yoy'
                    ? 'bg-white text-blue-600 shadow-sm font-semibold'
                    : 'text-[#64748b] hover:text-[#334155]'
                }`}
              >
                同比
              </button>
              <button
                onClick={() => setSubView('mom')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  subView === 'mom'
                    ? 'bg-white text-blue-600 shadow-sm font-semibold'
                    : 'text-[#64748b] hover:text-[#334155]'
                }`}
              >
                环比
              </button>
            </div>
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8fafc]">
                <th className={`${stickyColClass} bg-[#f8fafc] text-left min-w-[80px]`}>
                  细分项
                </th>
                {subCpiData.months.map((m) => (
                  <th key={m} className={`${headerCellClass} min-w-[56px]`}>
                    {m.slice(2)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedSubRows.map((entry, idx) => {
                if (entry.type === 'group') {
                  return (
                    <tr key={`g-${entry.label}`} className="bg-[#f1f5f9]">
                      <td
                        className="sticky left-0 z-10 bg-[#f1f5f9] px-3 py-1.5 text-xs font-bold tracking-wide"
                        style={{ color: entry.color }}
                        colSpan={1 + subCpiData.months.length}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-sm inline-block"
                            style={{ backgroundColor: entry.color }}
                          />
                          {entry.label}
                        </span>
                      </td>
                    </tr>
                  );
                }
                const row = entry.row;
                return (
                  <tr
                    key={row.name}
                    className="group transition-colors hover:bg-blue-50/40"
                  >
                    <td className={`${stickyColClass} bg-white group-hover:bg-blue-50/40 transition-colors`}>
                      <span className="inline-flex items-center gap-1.5">
                        {trendIcon(row.values[latestMonth])}
                        <WindIdHover id={subView === 'yoy' ? cpiSubWindId(row.name) : cpiSubMomWindId(row.name)}>{row.name}</WindIdHover>
                      </span>
                    </td>
                    {subCpiData.months.map((m) => {
                      const v = row.values[m];
                      const isLatest = m === latestMonth;
                      return (
                        <td
                          key={m}
                          className={`${cellClass} ${
                            isLatest ? 'ring-2 ring-inset ring-blue-300 font-bold' : ''
                          }`}
                          style={{
                            backgroundColor: v !== undefined ? getHeatColor(v) : '#f8fafc',
                            color:
                              v !== undefined && Math.abs(v) > 4
                                ? '#fff'
                                : '#1f2937',
                          }}
                        >
                          {v !== undefined ? fmt(v) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 图例 */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-t border-[#e2e8f0] bg-[#fafafa]">
          <span className="text-[10px] text-[#94a3b8]">涨幅：</span>
          {[0.5, 1, 2, 4].map((v) => (
            <div key={v} className="flex items-center gap-1">
              <span
                className="w-4 h-3 rounded-sm"
                style={{ backgroundColor: getHeatColor(v) }}
              />
              <span className="text-[10px] text-[#64748b]">&gt;{v}%</span>
            </div>
          ))}
          <span className="text-[10px] text-[#94a3b8] ml-2">跌幅：</span>
          {[4, 2, 1, 0.5].map((v) => (
            <div key={v} className="flex items-center gap-1">
              <span
                className="w-4 h-3 rounded-sm"
                style={{ backgroundColor: getHeatColor(-v) }}
              />
              <span className="text-[10px] text-[#64748b]">&lt;{-v}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* ============================
          分行业CPI表现情况
          ============================ */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
          <div>
            <h3 className="text-sm font-bold text-[#1e293b]">
              分行业CPI表现情况
            </h3>
            <p className="text-[11px] text-[#94a3b8] mt-0.5">
              数据来源：Wind（来源：八大项CPI.xlsx）| 点击类别行可展开细分项
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748b]">视图：</span>
            <div className="flex gap-0.5 bg-[#f1f5f9] rounded-lg p-0.5">
              <button
                onClick={() => setDetailView('yoy')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  detailView === 'yoy'
                    ? 'bg-white text-blue-600 shadow-sm font-semibold'
                    : 'text-[#64748b] hover:text-[#334155]'
                }`}
              >
                同比
              </button>
              <button
                onClick={() => setDetailView('mom')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  detailView === 'mom'
                    ? 'bg-white text-blue-600 shadow-sm font-semibold'
                    : 'text-[#64748b] hover:text-[#334155]'
                }`}
              >
                环比
              </button>
            </div>
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8fafc]">
                <th className={`${stickyColClass} bg-[#f8fafc] text-left min-w-[120px]`}>
                  行业类别
                </th>
                {renderMonthHeaders(eightMajorCpiData.months, majorSortCol, majorSortDir, handleMajorSort)}
              </tr>
            </thead>
            <tbody>
              {sortedMajorRows.flatMap((cat) => {
                const isExpanded = expandedCats[cat.name] ?? false;
                const rows: JSX.Element[] = [
                  <tr key={cat.name} className="transition-colors hover:bg-blue-50/40">
                    <td
                      className={`${stickyColClass} bg-white hover:bg-blue-50/40 transition-colors cursor-pointer select-none`}
                      onClick={() =>
                        setExpandedCats((prev) => ({
                          ...prev,
                          [cat.name]: !(prev[cat.name] ?? false),
                        }))
                      }
                    >
                      <span className="inline-flex items-center gap-1.5 font-bold text-[#1e293b]">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8]" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-[#94a3b8]" />
                        )}
                        <WindIdHover id={detailView === 'yoy' ? cpiMajorWindId(cat.name) : cpiMajorMomWindId(cat.name)}>{cat.name}</WindIdHover>
                      </span>
                    </td>
                    {eightMajorCpiData.months.map((m) => {
                      const v = cat.values[m];
                      const isLatest = m === latestMonth;
                      return (
                        <td
                          key={m}
                          className={`${cellClass} font-semibold ${
                            isLatest ? 'ring-2 ring-inset ring-blue-300' : ''
                          }`}
                          style={{
                            backgroundColor: v !== undefined ? getHeatColor(v) : '#f8fafc',
                            color: v !== undefined && Math.abs(v) > 4 ? '#fff' : '#1f2937',
                          }}
                        >
                          {v !== undefined ? fmt(v) : '—'}
                        </td>
                      );
                    })}
                  </tr>,
                ];
                // 展开的细分项紧跟该类别行之后
                if (isExpanded) {
                  cat.subs.forEach((sub) => {
                    rows.push(
                      <tr key={`${cat.name}-${sub.name}`} className="bg-[#fafbfc] transition-colors hover:bg-blue-50/30">
                        <td className={`${stickyColClass} bg-[#fafbfc] hover:bg-blue-50/30 transition-colors pl-8 text-[#475569]`}>
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-[#94a3b8] inline-block" />
                            <WindIdHover id={detailView === 'yoy' ? cpiDetailWindId(cat.name, sub.name) : cpiDetailMomWindId(cat.name, sub.name)}>{sub.name}</WindIdHover>
                          </span>
                        </td>
                        {eightMajorCpiData.months.map((m) => {
                          const v = sub.values[m];
                          const isLatest = m === latestMonth;
                          return (
                            <td
                              key={m}
                              className={`${cellClass} ${
                                isLatest ? 'ring-2 ring-inset ring-blue-200' : ''
                              }`}
                              style={{
                                backgroundColor: v !== undefined ? getHeatColor(v) : '#f8fafc',
                                color:
                                  v !== undefined && Math.abs(v) > 4 ? '#fff' : '#1f2937',
                              }}
                            >
                              {v !== undefined ? fmt(v) : '—'}
                            </td>
                          );
                        })}
                      </tr>,
                    );
                  });
                }
                return rows;
              })}
            </tbody>
          </table>
        </div>

        {/* 图例 */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-t border-[#e2e8f0] bg-[#fafafa]">
          <span className="text-[10px] text-[#94a3b8]">涨幅：</span>
          {[0.5, 1, 2, 4].map((v) => (
            <div key={v} className="flex items-center gap-1">
              <span
                className="w-4 h-3 rounded-sm"
                style={{ backgroundColor: getHeatColor(v) }}
              />
              <span className="text-[10px] text-[#64748b]">&gt;{v}%</span>
            </div>
          ))}
          <span className="text-[10px] text-[#94a3b8] ml-2">跌幅：</span>
          {[4, 2, 1, 0.5].map((v) => (
            <div key={v} className="flex items-center gap-1">
              <span
                className="w-4 h-3 rounded-sm"
                style={{ backgroundColor: getHeatColor(-v) }}
              />
              <span className="text-[10px] text-[#64748b]">&lt;{-v}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* 指标说明 */}
      <IndicatorExplanation
        title="CPI（居民消费价格指数）指标说明"
        items={[
          {
            label: '指标定义',
            content:
              'CPI是反映居民家庭购买消费商品及服务价格水平变动情况的指数，是衡量通货膨胀的主要指标。',
          },
          {
            label: '计算方式',
            content:
              '采用定基指数，基期为2020年=100，涵盖食品烟酒、衣着、居住、生活用品等8大类268个基本分类。',
          },
          {
            label: '数据来源',
            content:
              '国家统计局（www.stats.gov.cn），每月9日公布上月数据。',
          },
          {
            label: '指标意义',
            content:
              'CPI同比>3%提示通胀压力，<1%提示通缩风险。核心CPI（剔除食品和能源）更能反映长期通胀趋势。',
          },
        ]}
      />
    </div>
  );
}

export default CPIModule;
