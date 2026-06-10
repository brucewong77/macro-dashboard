import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, depositData, getIndexRange } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';

export function DepositModule() {
  const dr1 = useChartDateRange(2023, 4, 2026, 5);
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1.startStr, dr1.endStr]);
  const fm1 = useMemo(() => months.slice(s1, e1), [s1, e1]);

  return (
    <div className="space-y-4">
      <ChartCard title="人民币存款增量结构（万亿元）" subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.deposit}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          legend: { data: ['住户存款', '企业存款', '财政存款', '非银存款'], top: 5, textStyle: { color: '#64748b', fontSize: 10 } },
          grid: { top: 45, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '万亿元', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [
            { name: '住户存款', type: 'bar', stack: 'total', data: depositData.household.slice(s1, e1), itemStyle: { color: '#ef4444' }, barWidth: '60%' },
            { name: '企业存款', type: 'bar', stack: 'total', data: depositData.enterprise.slice(s1, e1), itemStyle: { color: '#3b82f6' } },
            { name: '财政存款', type: 'bar', stack: 'total', data: depositData.fiscal.slice(s1, e1), itemStyle: { color: '#f59e0b' } },
            { name: '非银存款', type: 'bar', stack: 'total', data: depositData.nonBank.slice(s1, e1), itemStyle: { color: '#22c55e' } },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      <IndicatorExplanation
        title="人民币存款指标说明"
        items={[
          { label: '住户存款', content: '居民储蓄存款，反映居民储蓄意愿。居民存款大增通常对应消费意愿低迷或避险情绪升温。' },
          { label: '企业存款', content: '非金融企业存款，反映企业经营活动现金流状况。' },
          { label: '财政存款', content: '各级政府在央行的存款，反映财政收支节奏。季末通常减少（财政支出加快）。' },
          { label: '非银存款', content: '证券、保险、信托等非银行金融机构存款，与市场投资活动相关。' },
        ]}
      />
    </div>
  );
}

export default DepositModule;
