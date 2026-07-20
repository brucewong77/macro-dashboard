import { useMemo, useState } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, pmiData, getIndexRange, getPrevMonthStr } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import {
  pmiPMI, pmi生产, pmi新订单, pmi新出口订单, pmi原材料库存,
  pmi从业人员, pmi供货商配送时间, pmi进口, pmi采购量, pmi产成品库存,
  pmi高技术, pmi装备, pmi消费品行业, pmi基础原材料行业,
  pmi大型企业, pmi中型企业, pmi小型企业,
  pmiSubItemKeys, pmiSubItemNames,
} from '../data/pmiExcelData';
import type { PmiExcelItem } from '../data/pmiExcelData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';
import { WindIdHover } from '../components/WindIdHover';

const pmiSubNames = pmiSubItemNames;

/* ─── 取细分项某月值 ─── */
function getSubVal(key: string, month: string): number {
  const map: Record<string, PmiExcelItem> = {
    production: pmi生产, new_orders: pmi新订单, new_export_orders: pmi新出口订单,
    raw_material_inv: pmi原材料库存, employment: pmi从业人员, supplier_delivery: pmi供货商配送时间,
    imports: pmi进口, purchase_qty: pmi采购量, finished_goods: pmi产成品库存,
  };
  return map[key]?.values[month] ?? 50;
}

/* ─── 热力图色阶：以50为荣枯线 ─── */
function getHeatBgColor(value: number): string {
  if (value === 50) return '#d1d5db';
  if (value > 50) {
    const diff = value - 50;
    const intensity = Math.min(diff / 5, 1);
    if (intensity < 0.15) return '#fee2e2';
    if (intensity < 0.30) return '#fecaca';
    if (intensity < 0.45) return '#fca5a5';
    if (intensity < 0.60) return '#f87171';
    if (intensity < 0.80) return '#ef4444';
    return '#b91c1c';
  }
  const diff = 50 - value;
  const intensity = Math.min(diff / 5, 1);
  if (intensity < 0.15) return '#dcfce7';
  if (intensity < 0.30) return '#bbf7d0';
  if (intensity < 0.45) return '#86efac';
  if (intensity < 0.60) return '#4ade80';
  if (intensity < 0.80) return '#22c55e';
  return '#15803d';
}

function getHeatTextColor(value: number): string {
  if (value === 50) return '#374151';
  const diff = Math.abs(value - 50);
  return diff > 4 ? '#ffffff' : '#1f2937';
}

export function PMIManufacturingModule() {
  const dr1 = useChartDateRange();
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1.startStr, dr1.endStr]);

  const cy = Number(getPrevMonthStr().slice(0, 4));

  /* ─── PMI走势图（最新到2026年5月） ─── */
  const trendOption = useMemo(() => {
    const cyData: (number | null)[] = [];
    const pyData: (number | null)[] = [];
    const p2yData: (number | null)[] = [];
    const latestMonth = Number(getPrevMonthStr().slice(5, 7));
    for (let m = 1; m <= 12; m++) {
      if (m <= latestMonth) {
        const ms = `${cy}-${String(m).padStart(2,'0')}`;
        const idx = months.indexOf(ms);
        cyData.push(idx >= 0 && pmiData.manufacturing[idx] !== undefined ? pmiData.manufacturing[idx]! : null);
      } else {
        cyData.push(null);
      }
      const pms = `${cy-1}-${String(m).padStart(2,'0')}`;
      const pidx = months.indexOf(pms);
      pyData.push(pidx >= 0 && pmiData.manufacturing[pidx] !== undefined ? pmiData.manufacturing[pidx]! : null);
      const p2ms = `${cy-2}-${String(m).padStart(2,'0')}`;
      const p2idx = months.indexOf(p2ms);
      p2yData.push(p2idx >= 0 && pmiData.manufacturing[p2idx] !== undefined ? pmiData.manufacturing[p2idx]! : null);
    }
    const allV = [...cyData, ...pyData, ...p2yData].filter(v => v !== null) as number[];
    const minV = Math.min(...allV);
    const maxV = Math.max(...allV);
    return {
      tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
      legend: { data: [`${cy}年`, `${cy-1}年`, `${cy-2}年`], top: 5, textStyle: { color: '#64748b', fontSize: 11 } },
      grid: { top: 40, right: 30, bottom: 30, left: 50 },
      xAxis: { type: 'category', data: Array.from({length: 12}, (_, i) => `${i+1}月`), axisLabel: { color: '#64748b', fontSize: 10 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', min: Math.floor(minV-1), max: Math.ceil(maxV+1), name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
      series: [
        { name: `${cy}年`, type: 'line', data: cyData, lineStyle: { color: '#ef4444', width: 2.5 }, itemStyle: { color: '#ef4444' }, symbol: 'circle', symbolSize: 5, label: { show: true, color: '#ef4444', fontSize: 9, fontWeight: 'bold', position: 'top' }, markLine: { silent: true, symbol: 'none', data: [{ yAxis: 50, lineStyle: { color: '#94a3b8', type: 'dashed', width: 1 } }] } },
        { name: `${cy-1}年`, type: 'line', data: pyData, lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' }, symbol: 'circle', symbolSize: 4 },
        { name: `${cy-2}年`, type: 'line', data: p2yData, lineStyle: { color: '#94a3b8', width: 1.5, type: 'dashed' as const }, itemStyle: { color: '#94a3b8' }, symbol: 'circle', symbolSize: 3 },
      ],
      animationDuration: 500,
    };
  }, []);

  /* ─── 分行业走势图（近24个月） ─── */
  const industryTrendOption = useMemo(() => {
    const industryItems = [
      { key: 'high_tech', name: '高技术制造业', data: pmi高技术, color: '#ef4444' },
      { key: 'equipment', name: '装备制造业', data: pmi装备, color: '#3b82f6' },
      { key: 'consumer_goods', name: '消费品行业', data: pmi消费品行业, color: '#10b981' },
      { key: 'basic_materials', name: '基础原材料行业', data: pmi基础原材料行业, color: '#f59e0b' },
    ];
    const latestMonth = Number(getPrevMonthStr().slice(5, 7));
    const xLabels: string[] = [];
    const seriesData = industryItems.map(() => [] as (number | null)[]);
    // 收集最近24个月的月份（从 cy-1 年的 latestMonth+1 月开始，到 cy 年 latestMonth 月）
    const months24: string[] = [];
    for (let m = latestMonth + 1; m <= 12; m++) {
      months24.push(`${cy-1}-${String(m).padStart(2,'0')}`);
    }
    for (let m = 1; m <= latestMonth; m++) {
      months24.push(`${cy}-${String(m).padStart(2,'0')}`);
    }
    for (const ms of months24) {
      xLabels.push(ms.slice(2));
      industryItems.forEach((item, i) => {
        const v = item.data.values[ms];
        seriesData[i].push(v !== undefined ? v : null);
      });
    }
    const allV = seriesData.flat().filter(v => v !== null) as number[];
    return {
      tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
      legend: { data: industryItems.map(i => i.name), top: 5, textStyle: { color: '#64748b', fontSize: 11 } },
      grid: { top: 40, right: 30, bottom: 30, left: 50 },
      xAxis: { type: 'category', data: xLabels, axisLabel: { color: '#64748b', fontSize: 9, rotate: 45 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', min: Math.floor(Math.min(...allV) - 1), max: Math.ceil(Math.max(...allV) + 1), name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
      series: industryItems.map((item, i) => ({
        name: item.name,
        type: 'line' as const,
        data: seriesData[i],
        lineStyle: { color: item.color, width: 2 },
        itemStyle: { color: item.color },
        symbol: 'circle',
        symbolSize: 4,
        markLine: { silent: true, symbol: 'none', data: [{ yAxis: 50, lineStyle: { color: '#94a3b8', type: 'dashed', width: 1 } }] },
      })),
      animationDuration: 500,
    };
  }, []);

  /* ─── 热力图 + 雷达图 月份数据 ─── */
  const heatmapSliceStart = Math.max(e1 - 12, s1);
  const heatmapMonths = useMemo(() => months.slice(heatmapSliceStart, e1), [heatmapSliceStart, e1]);
  const reversedMonths = useMemo(() => [...heatmapMonths].reverse(), [heatmapMonths]);
  const [sortBy, setSortBy] = useState<string | null>(null);

  // 热力图表格（使用PMI.xlsx原始值，不做同比/环比计算）
  const tableData = useMemo(() => {
    return pmiSubItemKeys.map((key, i) => ({
      name: pmiSubNames[i],
      values: reversedMonths.map((m) => {
        return getSubVal(key, m);
      }),
    }));
  }, [reversedMonths]);

  const sortedTable = useMemo(() => {
    if (!sortBy) return tableData;
    const colIdx = reversedMonths.indexOf(sortBy);
    if (colIdx < 0) return tableData;
    return [...tableData].sort((a, b) => b.values[colIdx] - a.values[colIdx]);
  }, [tableData, sortBy, reversedMonths]);

  // 雷达图（使用PMI.xlsx真实数据）
  const latestMonth = heatmapMonths[heatmapMonths.length - 1] || '';
  const prevMonth = heatmapMonths.length > 1 ? heatmapMonths[heatmapMonths.length - 2] : '';
  const radarOption = useMemo(() => {
    const latestVals = pmiSubItemKeys.map(k => getSubVal(k, latestMonth));
    const prevVals = pmiSubItemKeys.map(k => getSubVal(k, prevMonth));
    return {
      tooltip: { trigger: 'item' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b', fontSize: 12 } },
      legend: { data: [latestMonth, prevMonth], bottom: 0, textStyle: { color: '#64748b', fontSize: 11 } },
      radar: {
        indicator: pmiSubNames.map(name => ({ name, max: 55, min: 40 })),
        shape: 'polygon' as const,
        splitNumber: 3,
        axisName: { color: '#475569', fontSize: 11, fontWeight: 'bold' as const },
        splitLine: { lineStyle: { color: 'rgba(226,232,240,0.6)' } },
        splitArea: { areaStyle: { color: ['rgba(248,250,252,0.6)', 'rgba(241,245,249,0.6)'] } },
        axisLine: { lineStyle: { color: 'rgba(226,232,240,0.6)' } },
      },
      series: [{
        type: 'radar' as const,
        data: [
          { value: latestVals, name: latestMonth, lineStyle: { color: '#ef4444', width: 2.5 }, itemStyle: { color: '#ef4444' }, areaStyle: { color: 'rgba(239,68,68,0.15)' } },
          { value: prevVals, name: prevMonth, lineStyle: { color: '#3b82f6', width: 2, type: 'dashed' as const }, itemStyle: { color: '#3b82f6' }, areaStyle: { color: 'rgba(59,130,246,0.1)' } },
        ],
        symbol: 'circle', symbolSize: 4,
      }],
    };
  }, [latestMonth, prevMonth]);

  /* ─── 分企业规模表格（最新月靠左） ─── */
  const enterpriseItems = [
    { key: 'large_enterprise', name: '大型企业', color: '#ef4444', data: pmi大型企业 },
    { key: 'medium_enterprise', name: '中型企业', color: '#3b82f6', data: pmi中型企业 },
    { key: 'small_enterprise', name: '小型企业', color: '#10b981', data: pmi小型企业 },
  ];
  const enterpriseRecentMonths = useMemo(() => [...heatmapMonths].reverse(), [heatmapMonths]);

  return (
    <div className="space-y-4">
      {/* PMI走势图 */}
      <ChartCard title={<span>制造业PMI走势图（{cy} vs {cy-1} vs {cy-2}）<WindIdHover id="M0017126" /></span>}>
        <p className="text-[10px] text-[#94a3b8] mb-2">{DATA_SOURCES.pmi}</p>
        <ReactECharts option={trendOption} style={{ height: 380 }} />
      </ChartCard>

      {/* 分行业走势图 */}
      <ChartCard title={<span>分行业PMI走势图（{cy}年）</span>} subtitle={`${DATA_SOURCES.pmi} | 高技术:M6642294 装备:M6642295 消费品:M6642296 基础原材料:M6642297`}>
        <p className="text-[10px] text-[#94a3b8] mb-2">{DATA_SOURCES.pmi}</p>
        <ReactECharts option={industryTrendOption} style={{ height: 380 }} />
      </ChartCard>

      {/* 制造业PMI细分项变动热力图 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[#f1f5f9]">
          <div>
            <h3 className="text-sm font-semibold text-[#1e293b]">制造业PMI细分项变动热力图（近12个月，最新月靠左）</h3>
            <p className="text-[10px] text-[#94a3b8]">{DATA_SOURCES.pmi} | 生产:M0017127 新订单:M0017128 新出口订单:M0017129 原材料库存:M0017135 从业人员:M0017136 供货商配送:M0017137 进口:M0017133 采购量:M0017132 产成品库存:M0017131</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select className="border border-[#e2e8f0] rounded text-[10px] px-1 py-0.5 text-[#64748b]" value={sortBy || ''} onChange={e => setSortBy(e.target.value || null)}>
              <option value="">默认排序</option>
              {reversedMonths.map(m => <option key={m} value={m}>按{m}排序</option>)}
            </select>
          </div>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">细分项</th>
                  {reversedMonths.map(m => (
                    <th key={m} className="border border-[#e2e8f0] px-1.5 py-1.5 text-center text-[#475569] font-semibold min-w-[52px]">{m.slice(2)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedTable.map((row, ri) => (
                  <tr key={row.name} className={ri % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                    <td className="border border-[#e2e8f0] px-2 py-1 text-[#334155] font-medium sticky left-0 bg-inherit">
                      <WindIdHover id={({'生产':'M0017127','新订单':'M0017128','新出口订单':'M0017129','原材料库存':'M0017135','从业人员':'M0017136','供货商配送时间':'M0017137','进口':'M0017133','采购量':'M0017132','产成品库存':'M0017131'}[row.name]??'')}>{row.name}</WindIdHover>
                    </td>
                    {row.values.map((v, ci) => (
                      <td key={ci} className="border border-[#e2e8f0] px-1 py-1 text-center tabular-nums" style={{ backgroundColor: getHeatBgColor(v), color: getHeatTextColor(v) }}>
                        {v.toFixed(1)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 细分项雷达图 */}
      <ChartCard title="制造业PMI细分项雷达图" subtitle={`${prevMonth} vs ${latestMonth}`}>
        <ReactECharts option={radarOption} style={{ height: 420 }} />
      </ChartCard>

      {/* 分企业规模（最新月份靠左） */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="px-4 py-2.5 border-b border-[#f1f5f9]">
          <h3 className="text-sm font-semibold text-[#1e293b]">制造业PMI分企业规模（近12个月，最新月靠左）</h3>
          <p className="text-[10px] text-[#94a3b8]">{DATA_SOURCES.pmi}</p>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">企业规模</th>
                  {enterpriseRecentMonths.map(m => (
                    <th key={m} className="border border-[#e2e8f0] px-1.5 py-1.5 text-center text-[#475569] font-semibold min-w-[52px]">{m.slice(2)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enterpriseItems.map((item, ri) => (
                  <tr key={item.key} className={ri % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                    <td className="border border-[#e2e8f0] px-2 py-1.5 text-[#334155] font-medium sticky left-0 bg-inherit">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                        <WindIdHover id={({'大型企业':'M5206738','中型企业':'M5206739','小型企业':'M5206740'}[item.name]??'')}>{item.name}</WindIdHover>
                      </span>
                    </td>
                    {enterpriseRecentMonths.map(m => {
                      const v = item.data.values[m];
                      const bg = v !== undefined ? (v >= 50 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)') : '#f8fafc';
                      return (
                        <td key={m} className="border border-[#e2e8f0] px-1 py-1.5 text-center tabular-nums font-semibold" style={{ backgroundColor: bg, color: v !== undefined && v >= 50 ? '#dc2626' : v !== undefined && v < 50 ? '#16a34a' : '#1f2937' }}>
                          {v !== undefined ? v.toFixed(1) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 指标说明 */}
      <IndicatorExplanation
        title="PMI（采购经理指数）指标说明"
        items={[
          { label: '指标定义', content: 'PMI通过对企业采购经理的月度调查结果统计汇总编制，是国际上通用的监测宏观经济走势的先行性指数。' },
          { label: '计算方式', content: '采用扩散指数方法，PMI=50为荣枯线，>50表示扩张，<50表示收缩。包含生产、新订单、原材料库存等13个分项指数。' },
          { label: '数据来源', content: '国家统计局（www.stats.gov.cn）与中国物流与采购联合会，每月最后一天公布。' },
          { label: '指标意义', content: 'PMI是经济先行指标，领先GDP约3-6个月。制造业PMI连续2月>50通常预示经济复苏。' },
        ]}
      />
    </div>
  );
}

export default PMIManufacturingModule;
