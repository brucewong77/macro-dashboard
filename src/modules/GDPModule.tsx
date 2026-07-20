import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';
import { WindIdHover } from '../components/WindIdHover';
import gdpRaw from '../data/gdpExcelData.json';

const gdpData = gdpRaw as {
  dates: string[];
  columns: Record<string, { name: string; col: number; data: Record<string, number> }>;
};

const g = (id: string) => gdpData.columns[id]?.data ?? {};

export function GDPModule() {
  const dr = useChartDateRange(2020, 1);
  const chartDates = useMemo(() => {
    return gdpData.dates.filter(d => d >= dr.startStr && d <= dr.endStr);
  }, [dr]);

  const gdpCum = useMemo(() => chartDates.map(d => g('M0000541')[d] ?? null), [chartDates]);
  const gdpYoy = useMemo(() => chartDates.map(d => g('M0039354')[d] ?? null), [chartDates]);
  const secondaryYoy = useMemo(() => chartDates.map(d => g('M5567902')[d] ?? null), [chartDates]);
  const tertiaryYoy = useMemo(() => chartDates.map(d => g('M5567903')[d] ?? null), [chartDates]);
  const primaryYoy = useMemo(() => chartDates.map(d => g('M5567901')[d] ?? null), [chartDates]);
  const nominalYoy = useMemo(() => chartDates.map(d => g('X4608416')[d] ?? null), [chartDates]);
  const deflator = useMemo(() => chartDates.map(d => g('M5439528')[d] ?? null), [chartDates]);

  const recent = gdpData.dates.slice(-12).reverse();
  const tableRows = [
    { name: 'GDP不变价累计同比', wid: 'M0000541' },
    { name: 'GDP不变价当季同比', wid: 'M0039354' },
    { name: '第一产业当季同比', wid: 'M5567901' },
    { name: '第二产业当季同比', wid: 'M5567902' },
    { name: '第三产业当季同比', wid: 'M5567903' },
    { name: 'GDP现价当季同比', wid: 'X4608416' },
    { name: 'GDP平减指数当季同比', wid: 'M5439528' },
    { name: 'GDP现价当季值(亿)', wid: 'M5567876' },
  ];

  // 通用柱状图label
  const barLabel = {
    show: true,
    position: 'top' as const,
    fontSize: 10,
    color: '#1e293b',
    fontWeight: 500 as const,
    formatter: (p: any) => (p.value != null ? (p.value >= 0 ? '+' : '') + p.value.toFixed(1) + '%' : ''),
  };

  // 柱状图颜色函数
  const barColor = (p: any) => (p.value ?? 0) >= 0 ? 'rgba(37,99,235,0.7)' : 'rgba(239,68,68,0.6)';

  return (
    <div className="space-y-4">
      {/* Part 1: GDP累计同比 — 柱状图 */}
      <ChartCard title={<WindIdHover id="M0000541">GDP不变价累计同比增速</WindIdHover>}
        subtitle={`${dr.startStr} ~ ${dr.endStr} | 数据来源：国家统计局`} dateRange={dr}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 25, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: chartDates, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: [
            { type: 'bar', data: gdpCum, barWidth: '45%', itemStyle: { color: barColor, borderRadius: [3, 3, 0, 0] }, label: barLabel },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      {/* Part 2: GDP当季同比 — 柱状图（仅GDP） */}
      <ChartCard title={<WindIdHover id="M0039354">GDP不变价当季同比增速</WindIdHover>}
        subtitle={`${dr.startStr} ~ ${dr.endStr} | 数据来源：国家统计局`} dateRange={dr}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 25, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: chartDates, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: [
            { type: 'bar', data: gdpYoy, barWidth: '45%', itemStyle: { color: barColor, borderRadius: [3, 3, 0, 0] }, label: barLabel },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      {/* Part 3: 分产业当季同比 — 折线图 */}
      <ChartCard title={<WindIdHover id="M5567901">GDP分产业当季同比增速</WindIdHover>}
        subtitle={`${dr.startStr} ~ ${dr.endStr} | 数据来源：国家统计局`} dateRange={dr}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          legend: { data: ['第一产业', '第二产业', '第三产业'], top: 5, textStyle: { color: '#64748b', fontSize: 11 }, icon: 'circle', itemWidth: 8, itemHeight: 8 },
          grid: { top: 40, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: chartDates, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: [
            { name: '第一产业', type: 'line', data: primaryYoy, smooth: true, lineStyle: { color: '#22c55e', width: 2 }, itemStyle: { color: '#22c55e' }, symbol: 'diamond', symbolSize: 4 },
            { name: '第二产业', type: 'line', data: secondaryYoy, smooth: true, lineStyle: { color: '#f59e0b', width: 2 }, itemStyle: { color: '#f59e0b' }, symbol: 'square', symbolSize: 4 },
            { name: '第三产业', type: 'line', data: tertiaryYoy, smooth: true, lineStyle: { color: '#8b5cf6', width: 2 }, itemStyle: { color: '#8b5cf6' }, symbol: 'triangle', symbolSize: 4 },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      {/* Part 4: 现价同比与平减指数 */}
      <ChartCard title={<WindIdHover id="X4608416">GDP现价同比与平减指数</WindIdHover>}
        subtitle={`${dr.startStr} ~ ${dr.endStr} | 数据来源：国家统计局`} dateRange={dr}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          legend: { data: ['现价同比', '平减指数'], top: 5, textStyle: { color: '#64748b', fontSize: 11 }, icon: 'circle', itemWidth: 8, itemHeight: 8 },
          grid: { top: 40, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: chartDates, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: [
            { name: '现价同比', type: 'line', data: nominalYoy, smooth: true, lineStyle: { color: '#ef4444', width: 2 }, itemStyle: { color: '#ef4444' }, symbol: 'circle', symbolSize: 3 },
            { name: '平减指数', type: 'bar', data: deflator, barWidth: '30%', itemStyle: { color: (p: any) => (p.value ?? 0) >= 0 ? 'rgba(6,182,212,0.6)' : 'rgba(239,68,68,0.5)', borderRadius: [3, 3, 0, 0] } },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      {/* Part 5: 表格（带颜色规则） */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="px-4 py-2.5 border-b border-[#f1f5f9]">
          <h3 className="text-sm font-semibold text-[#1e293b]">GDP主要指标（近12个季度，最新靠左）</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc]">
                <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">指标</th>
                {recent.map(q => (
                  <th key={q} className="border border-[#e2e8f0] px-2 py-1.5 text-center text-[#475569] font-semibold min-w-[64px]">{q}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, ri) => (
                <tr key={row.name} className={ri % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                  <td className="sticky left-0 bg-inherit border border-[#e2e8f0] px-2 py-1 text-[#334155] font-medium">
                    <WindIdHover id={row.wid}>{row.name}</WindIdHover>
                  </td>
                  {recent.map((q, ci) => {
                    const v = g(row.wid)[q];
                    let display = '--';
                    let colorClass = 'text-[#1e293b]';

                    if (v != null) {
                      display = row.name.includes('当季值')
                        ? (v >= 10000 ? (v / 10000).toFixed(2) + '万亿' : v.toFixed(0))
                        : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

                      // 颜色规则：后一个数（ci=0最新）对比前一个数（ci+1）
                      if (ci < recent.length - 1) {
                        const nextQ = recent[ci + 1];
                        const prevV = g(row.wid)[nextQ];
                        if (prevV != null && row.name !== 'GDP现价当季值(亿)') {
                          if (v > prevV) colorClass = 'text-[#ef4444]';       // 上升 → 红
                          else if (v < prevV) colorClass = 'text-[#22c55e]'; // 下降 → 绿
                        }
                      }
                    }

                    return (
                      <td key={q} className={`border border-[#e2e8f0] px-2 py-1 text-center tabular-nums font-mono ${colorClass}`}>
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <IndicatorExplanation title="GDP（国内生产总值）指标说明" items={[
        { label: '指标定义', content: 'GDP是按市场价格计算的一个国家所有常住单位在一定时期内生产活动的最终成果。' },
        { label: '不变价', content: '剔除价格变动因素后的实际GDP增速，反映真实经济增长。' },
        { label: '累计同比', content: '从年初到当季的累计GDP同比增长率，比当季同比更能反映趋势。' },
        { label: '现价', content: '按当期市场价格计算的GDP，包含价格变动因素。' },
        { label: '平减指数', content: '现价GDP与不变价GDP之比，衡量整体价格水平变动。' },
        { label: '数据来源', content: '国家统计局（www.stats.gov.cn），每季度公布。' },
      ]} />
    </div>
  );
}

export default GDPModule;
