import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, incomeData, getIndexRange } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';

export function IncomeModule() {
  const dr1 = useChartDateRange(2015, 1, 2026, 5);
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1.startStr, dr1.endStr]);
  const fm1 = useMemo(() => months.slice(s1, e1), [s1, e1]);

  return (
    <div className="space-y-4">
      <ChartCard title="居民人均可支配收入（元）" subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.income}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          legend: { data: ['全国', '城镇', '农村'], top: 5, textStyle: { color: '#64748b', fontSize: 11 } },
          grid: { top: 40, right: 20, bottom: 30, left: 70 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '元', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [
            { name: '全国', type: 'line', data: incomeData.national.slice(s1, e1), smooth: true, lineStyle: { color: '#ef4444', width: 2 }, itemStyle: { color: '#ef4444' }, symbol: 'circle', symbolSize: 3 },
            { name: '城镇', type: 'line', data: incomeData.urban.slice(s1, e1), smooth: true, lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' }, symbol: 'circle', symbolSize: 3 },
            { name: '农村', type: 'line', data: incomeData.rural.slice(s1, e1), smooth: true, lineStyle: { color: '#22c55e', width: 2 }, itemStyle: { color: '#22c55e' }, symbol: 'circle', symbolSize: 3 },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      <IndicatorExplanation
        title="居民收入指标说明"
        items={[
          { label: '指标定义', content: '居民可支配收入指居民可用于最终消费支出和储蓄的总和，即调查户可以用来自由支配的收入。' },
          { label: '数据来源', content: '国家统计局（www.stats.gov.cn），季度公布。' },
          { label: '指标意义', content: '收入增长是消费的基础，居民收入增速>经济增速表明居民分享增长成果。城乡收入比缩小体现共同富裕进展。' },
        ]}
      />
    </div>
  );
}

export default IncomeModule;
