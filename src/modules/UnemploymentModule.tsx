import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, unemploymentData, getIndexRange, blankUnpublished } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';

export function UnemploymentModule() {
  const dr1 = useChartDateRange();
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1.startStr, dr1.endStr]);
  const fm1 = useMemo(() => months.slice(s1, e1), [s1, e1]);
  const unempNatlData = useMemo(() => blankUnpublished(fm1, unemploymentData.national.slice(s1, e1), 'unemployment'), [fm1, s1, e1]);
  const unempYouthData = useMemo(() => blankUnpublished(fm1, unemploymentData.byAge.youth.slice(s1, e1), 'unemployment'), [fm1, s1, e1]);
  const unempPrimeData = useMemo(() => blankUnpublished(fm1, unemploymentData.byAge.prime.slice(s1, e1), 'unemployment'), [fm1, s1, e1]);

  const nationalSlice = unemploymentData.national.slice(s1, e1).filter((v): v is number => v !== null);
  const primeSlice = unemploymentData.byAge.prime.slice(s1, e1).filter((v): v is number => v !== null);
  const allNational = [...nationalSlice, ...primeSlice];
  const natMin = Math.min(...allNational);
  const natMax = Math.max(...allNational);
  const yMin1 = Math.floor((natMin - 0.2) * 10) / 10;
  const yMax1 = Math.ceil((natMax + 0.2) * 10) / 10;

  return (
    <div className="space-y-4">
      <ChartCard title="城镇调查失业率" subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.unemployment}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          legend: { data: ['全国', '16-24岁', '25-59岁'], top: 5, textStyle: { color: '#64748b', fontSize: 11 } },
          grid: { top: 40, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', min: yMin1, max: yMax1, name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [
            { name: '全国', type: 'line', data: unempNatlData, smooth: true, lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' }, symbol: 'circle', symbolSize: 3 },
            { name: '16-24岁', type: 'line', data: unempYouthData, smooth: true, lineStyle: { color: '#ef4444', width: 2 }, itemStyle: { color: '#ef4444' }, symbol: 'circle', symbolSize: 3 },
            { name: '25-59岁', type: 'line', data: unempPrimeData, smooth: true, lineStyle: { color: '#22c55e', width: 2 }, itemStyle: { color: '#22c55e' }, symbol: 'circle', symbolSize: 3 },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>
    </div>
  );
}


      <div className="mt-4">
        <IndicatorExplanation
          title="城镇调查失业率指标说明"
          items={[
            { label: '指标定义', content: '城镇调查失业率指城镇调查失业人员占城镇调查就业人员与失业人员之和的比率，是国际劳工组织推荐的劳动力市场核心指标。' },
            { label: '计算方式', content: '通过对全国34万个住户的月度劳动力抽样调查获得，采用国际可比的标准定义。' },
            { label: '数据来源', content: '国家统计局（www.stats.gov.cn），每月中旬公布上月数据。' },
            { label: '指标意义', content: '失业率<5.5%为充分就业水平。16-24岁青年失业率是观察就业结构性矛盾的重要窗口。' },
          ]}
        />
      </div>


export default UnemploymentModule;
