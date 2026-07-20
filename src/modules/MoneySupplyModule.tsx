import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, moneyData, getIndexRange, blankUnpublished } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';
import { WindIdHover } from '../components/WindIdHover';

export function MoneySupplyModule() {
  const dr1 = useChartDateRange(2018, 1);
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1.startStr, dr1.endStr]);
  const fm1 = useMemo(() => months.slice(s1, e1), [s1, e1]);
  const m2Data = useMemo(() => blankUnpublished(fm1, moneyData.m2.slice(s1, e1), 'sf'), [fm1, s1, e1]);
  const m1Data = useMemo(() => blankUnpublished(fm1, moneyData.m1.slice(s1, e1), 'sf'), [fm1, s1, e1]);
  const m0Data = useMemo(() => blankUnpublished(fm1, moneyData.m0.slice(s1, e1), 'sf'), [fm1, s1, e1]);

  return (
    <div className="space-y-4">
      <ChartCard title={<span>M0<WindIdHover id="M0001415" />/M1<WindIdHover id="M0001414" />/M2<WindIdHover id="M0001413" />同比增速</span>} subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.moneySupply}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          legend: { data: ['M0', 'M1', 'M2'], top: 5, textStyle: { color: '#64748b', fontSize: 11 } },
          grid: { top: 40, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [
            { name: 'M0', type: 'line', data: m0Data, smooth: true, lineStyle: { color: '#f59e0b', width: 1.5 }, itemStyle: { color: '#f59e0b' }, symbol: 'circle', symbolSize: 2 },
            { name: 'M1', type: 'line', data: m1Data, smooth: true, lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' }, symbol: 'circle', symbolSize: 3 },
            { name: 'M2', type: 'line', data: m2Data, smooth: true, lineStyle: { color: '#ef4444', width: 2 }, itemStyle: { color: '#ef4444' }, symbol: 'circle', symbolSize: 3 },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      <ChartCard title="M2-M1剪刀差（百分点）" subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.moneySupply}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '百分点', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [{
            type: 'bar', data: moneyData.m2m1Diff.slice(s1, e1),
            itemStyle: { color: (p: any) => p.value >= 0 ? 'rgba(139,92,246,0.7)' : 'rgba(6,182,212,0.7)', borderRadius: [3, 3, 0, 0] },
            barWidth: '60%',
          }],
          animationDuration: 500,
        }} style={{ height: 360 }} />
      </ChartCard>

      <IndicatorExplanation
        title="货币供应量指标说明"
        items={[
          { label: 'M0', content: '流通中现金，即银行体系以外各个单位的库存现金和居民的手持现金之和。' },
          { label: 'M1', content: 'M0+企业活期存款，反映现实购买力，是经济活跃度的先行指标。' },
          { label: 'M2', content: 'M1+企业定期存款+居民储蓄存款+其他存款，反映社会总需求变化和未来通胀压力。' },
          { label: 'M2-M1剪刀差', content: 'M2增速与M1增速之差。差值扩大说明资金活化程度降低（企业倾向定期存款），差值收窄说明资金活化程度改善。' },
        ]}
      />
    </div>
  );
}

export default MoneySupplyModule;
