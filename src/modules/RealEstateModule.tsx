import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, realestateData, getIndexRange } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';

export function RealEstateModule() {
  const dr1 = useChartDateRange(2022, 4, 2026, 5);
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1.startStr, dr1.endStr]);
  const fm1 = useMemo(() => months.slice(s1, e1), [s1, e1]);

  return (
    <div className="space-y-4">
      <ChartCard title="商品房销售面积累计同比" subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.realestate}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [
            { type: 'line', data: realestateData.salesAreaAccumYoy.slice(s1, e1), smooth: true, name: '销售面积累计同比', lineStyle: { color: '#06b6d4', width: 2 }, itemStyle: { color: '#06b6d4' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(6,182,212,0.15)' }, { offset: 1, color: 'rgba(6,182,212,0)' }] } }, symbol: 'circle', symbolSize: 3 },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      <ChartCard title="商品房月度平均销售单价（元/平方米）" subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.realestate}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 70 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '元/㎡', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [
            { type: 'line', data: realestateData.avgPrice.slice(s1, e1), smooth: true, name: '均价', lineStyle: { color: '#8b5cf6', width: 2 }, itemStyle: { color: '#8b5cf6' }, symbol: 'circle', symbolSize: 3 },
          ],
          animationDuration: 500,
        }} style={{ height: 360 }} />
      </ChartCard>

      <IndicatorExplanation
        title="房地产指标说明"
        items={[
          { label: '指标定义', content: '商品房销售面积指报告期内出售新建商品房屋的合同总面积。销售单价=销售额/销售面积。' },
          { label: '数据来源', content: '国家统计局（www.stats.gov.cn），每月中旬公布。' },
          { label: '指标意义', content: '房地产是经济支柱产业，关联上下游50多个行业。销售面积同比降幅收窄是行业企稳的信号。' },
        ]}
      />
    </div>
  );
}

export default RealEstateModule;
