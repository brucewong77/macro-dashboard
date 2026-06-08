import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, creditData, getIndexRange } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';

export function CreditModule() {
  const dr1 = useChartDateRange(2023, 4, 2026, 3);
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1.startStr, dr1.endStr]);
  const fm1 = useMemo(() => months.slice(s1, e1), [s1, e1]);

  return (
    <div className="space-y-4">
      <ChartCard title="人民币贷款结构（万亿元）" subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.credit}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          legend: { data: ['住户短期', '住户中长期', '企业短期', '企业中长期', '票据融资'], top: 5, textStyle: { color: '#64748b', fontSize: 10 } },
          grid: { top: 45, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '万亿元', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [
            { name: '住户短期', type: 'bar', stack: 'household', data: creditData.householdShort.slice(s1, e1), itemStyle: { color: '#f59e0b' }, barWidth: '60%' },
            { name: '住户中长期', type: 'bar', stack: 'household', data: creditData.householdLong.slice(s1, e1), itemStyle: { color: '#ef4444' } },
            { name: '企业短期', type: 'bar', stack: 'enterprise', data: creditData.enterpriseShort.slice(s1, e1), itemStyle: { color: '#3b82f6' } },
            { name: '企业中长期', type: 'bar', stack: 'enterprise', data: creditData.enterpriseLong.slice(s1, e1), itemStyle: { color: '#22c55e' } },
            { name: '票据融资', type: 'bar', data: creditData.billFinancing.slice(s1, e1), itemStyle: { color: '#8b5cf6' } },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      <IndicatorExplanation
        title="人民币贷款指标说明"
        items={[
          { label: '指标定义', content: '人民币贷款是社融最重要的组成部分，反映银行体系对实体经济的信贷投放。按主体分为住户贷款和企业贷款，按期限分为短期和中长期。' },
          { label: '数据来源', content: '中国人民银行（www.pbc.gov.cn），每月中旬公布。' },
          { label: '指标意义', content: '企业中长期贷款反映企业投资意愿，住户中长期贷款主要对应房贷，是观察房地产景气度的先行指标。' },
        ]}
      />
    </div>
  );
}

export default CreditModule;
