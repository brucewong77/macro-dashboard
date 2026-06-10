import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, fxReserveData, getIndexRange } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';

export function FXReserveModule() {
  const dr1 = useChartDateRange();
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1.startStr, dr1.endStr]);
  const fm1 = useMemo(() => months.slice(s1, e1), [s1, e1]);
  const amountSlice = fxReserveData.amount.slice(s1, e1);
  const minAmount = Math.min(...amountSlice);
  const maxAmount = Math.max(...amountSlice);
  const yMin = Math.floor((minAmount / 10000) * 0.98 * 100) / 100;
  const yMax = Math.ceil((maxAmount / 10000) * 1.02 * 100) / 100;

  return (
    <div className="space-y-4">
      <ChartCard title="外汇储备金额" subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.fxReserve}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 60 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '万亿美元', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, min: yMin, max: yMax, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [{ type: 'bar', data: amountSlice.map((v: number) => (v / 10000).toFixed(2)), itemStyle: { color: '#3b82f6', borderRadius: [3, 3, 0, 0] }, barWidth: '60%' }],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>
    </div>
  );
}


      <div className="mt-4">
        <IndicatorExplanation
          title="外汇储备指标说明"
          items={[
            { label: '指标定义', content: '外汇储备指一国政府持有的可随时兑换外国货币的资产，包括外币现钞、外币存款、外币有价证券等。' },
            { label: '计算方式', content: '按SDR（特别提款权）计价和美元计价分别公布，包含在央行资产负债表内。' },
            { label: '数据来源', content: '国家外汇管理局（www.safe.gov.cn），每月7日公布上月末数据。' },
            { label: '指标意义', content: '外汇储备规模反映国际支付能力和人民币汇率稳定程度。连续大幅下降可能预示资本外流压力。' },
          ]}
        />
      </div>


export default FXReserveModule;
