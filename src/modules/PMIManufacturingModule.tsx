import { useMemo, useState } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, pmiData, getIndexRange } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';

const pmiSubItems = ['生产', '新订单', '原材料库存', '从业人员', '供应商配送', '新出口订单', '进口', '采购量', '产成品库存'];

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

// 根据值大小返回对比度足够的文字颜色
function getHeatTextColor(value: number): string {
  if (value === 0) return '#374151';
  const intensity = Math.min(Math.abs(value) / 4, 1);
  return intensity > 0.60 ? '#ffffff' : '#1f2937';
}

// 生成表格数据
// heatView='yoy': 值为PMI与荣枯线50的差值（偏离荣枯线）
// heatView='mom': 值为当前月PMI - 上月PMI（环比变化）
function generateTableData(monthsArr: string[], heatSliceStart: number, heatView: 'yoy' | 'mom') {
  return pmiSubItems.map((name, i) => ({
    name,
    values: monthsArr.map((_, mi) => {
      const monthIdx = heatSliceStart + mi;
      const existing = pmiData.heatmapData.find((h: any) => h[0] === monthIdx && h[1] === i);
      const rawVal = existing ? existing[2] : 50;

      if (heatView === 'yoy') {
        // 同比视图：偏离荣枯线50的差值
        return Number((rawVal - 50).toFixed(2));
      } else {
        // 环比视图：与上月的变化
        if (monthIdx <= 0) return 0;
        const prevExisting = pmiData.heatmapData.find((h: any) => h[0] === monthIdx - 1 && h[1] === i);
        const prevVal = prevExisting ? prevExisting[2] : 50;
        return Number((rawVal - prevVal).toFixed(2));
      }
    }),
  }));
}

// 按某个月份的值排序行数据
function sortTableData(
  rows: { name: string; values: number[] }[],
  sortColIdx: number
): { name: string; values: number[] }[] {
  return [...rows].sort((a, b) => b.values[sortColIdx] - a.values[sortColIdx]);
}

export function PMIManufacturingModule() {
  const dr1 = useChartDateRange();
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1.startStr, dr1.endStr]);

  // 走势图取消时间段选择
  const trendOption = useMemo(() => {
    const cy = 2026;
    const cyData: (number | null)[] = [];
    const pyData: (number | null)[] = [];
    const p2yData: (number | null)[] = [];
    for (let m = 1; m <= 12; m++) {
      const ms = `${cy}-${String(m).padStart(2,'0')}`;
      const idx = months.indexOf(ms);
      cyData.push(idx >= 0 ? pmiData.manufacturing[idx]! : null);
      const pms = `${cy-1}-${String(m).padStart(2,'0')}`;
      const pidx = months.indexOf(pms);
      pyData.push(pidx >= 0 ? pmiData.manufacturing[pidx]! : null);
      const p2ms = `${cy-2}-${String(m).padStart(2,'0')}`;
      const p2idx = months.indexOf(p2ms);
      p2yData.push(p2idx >= 0 ? pmiData.manufacturing[p2idx]! : null);
    }
    const allV = [...cyData, ...pyData, ...p2yData].filter(v => v !== null) as number[];
    const minV = Math.min(...allV);
    const maxV = Math.max(...allV);
    return {
      tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
      legend: { data: ['2026年', '2025年', '2024年'], top: 5, textStyle: { color: '#64748b', fontSize: 11 } },
      grid: { top: 40, right: 30, bottom: 30, left: 50 },
      xAxis: { type: 'category', data: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'], axisLabel: { color: '#64748b', fontSize: 10 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', min: Math.floor(minV-1), max: Math.ceil(maxV+1), name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
      series: [
        { name: '2026年', type: 'line', data: cyData, lineStyle: { color: '#ef4444', width: 2.5 }, itemStyle: { color: '#ef4444' }, symbol: 'circle', symbolSize: 5, label: { show: true, color: '#ef4444', fontSize: 9, fontWeight: 'bold', position: 'top' }, markLine: { silent: true, symbol: 'none', data: [{ yAxis: 50, lineStyle: { color: '#94a3b8', type: 'dashed', width: 1 } }] } },
        { name: '2025年', type: 'line', data: pyData, lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' }, symbol: 'circle', symbolSize: 4 },
        { name: '2024年', type: 'line', data: p2yData, lineStyle: { color: '#94a3b8', width: 1.5, type: 'dashed' as const }, itemStyle: { color: '#94a3b8' }, symbol: 'circle', symbolSize: 3 },
      ],
      animationDuration: 500,
    };
  }, []);

  // 热力图
  const heatmapSliceStart = Math.max(e1 - 12, s1);
  const heatmapMonths = useMemo(() => months.slice(heatmapSliceStart, e1), [heatmapSliceStart, e1]);
  const [heatView, setHeatView] = useState<'yoy' | 'mom'>('yoy');
  const [sortBy, setSortBy] = useState<string | null>(null);

  // 生成表格数据（根据同比/环比视图生成不同数据）
  const tableData = useMemo(
    () => generateTableData(heatmapMonths, heatmapSliceStart, heatView),
    [heatmapMonths, heatmapSliceStart, heatView]
  );

  // 排序后的数据
  const sortedTable = useMemo(() => {
    if (!sortBy) return tableData;
    const colIdx = heatmapMonths.indexOf(sortBy);
    if (colIdx < 0) return tableData;
    return sortTableData(tableData, colIdx);
  }, [tableData, sortBy, heatmapMonths]);

  return (
    <div className="space-y-4">
      <ChartCard title="制造业PMI走势图（2026 vs 2025 vs 2024）">
        <p className="text-[10px] text-[#94a3b8] mb-2">{DATA_SOURCES.pmi}</p>
        <ReactECharts option={trendOption} style={{ height: 380 }} />
      </ChartCard>

      {/* 制造业PMI细分项变动热力图 - 纯HTML表格 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[#f1f5f9]">
          <div>
            <h3 className="text-sm font-semibold text-[#1e293b]">制造业PMI细分项变动热力图（近12个月{heatView === 'yoy' ? '同比' : '环比'}，偏离荣枯线50）</h3>
            <p className="text-[10px] text-[#94a3b8]">{DATA_SOURCES.pmi}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              <button onClick={() => setHeatView('yoy')} className={`px-2 py-0.5 text-[10px] rounded ${heatView === 'yoy' ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>同比</button>
              <button onClick={() => setHeatView('mom')} className={`px-2 py-0.5 text-[10px] rounded ${heatView === 'mom' ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>环比</button>
            </div>
            <select className="border border-[#e2e8f0] rounded text-[10px] px-1 py-0.5 text-[#64748b]" value={sortBy || ''} onChange={e => setSortBy(e.target.value || null)}>
              <option value="">默认排序</option>
              {heatmapMonths.map(m => <option key={m} value={m}>按{m}排序</option>)}
            </select>
          </div>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">
                    细分项
                  </th>
                  {heatmapMonths.map(m => (
                    <th key={m} className="border border-[#e2e8f0] px-1.5 py-1.5 text-center text-[#475569] font-semibold min-w-[52px]">
                      {m.slice(2)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedTable.map((row, ri) => (
                  <tr key={row.name} className={ri % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                    <td className="border border-[#e2e8f0] px-2 py-1 text-[#334155] font-medium sticky left-0 bg-inherit">
                      {row.name}
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
