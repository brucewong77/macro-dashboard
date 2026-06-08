import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, socialFinancingData, getIndexRange } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';

export function SocialFinancingModule() {
  const dr1 = useChartDateRange(2022, 4, 2026, 3);
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1.startStr, dr1.endStr]);
  const fm1 = useMemo(() => months.slice(s1, e1), [s1, e1]);

  return (
    <div className="space-y-4">
      <ChartCard title="社会融资规模存量同比增速" subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.socialFinancing}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [
            { type: 'line', data: socialFinancingData.yoy.slice(s1, e1), smooth: true, name: '社融存量同比', lineStyle: { color: '#06b6d4', width: 2 }, itemStyle: { color: '#06b6d4' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(6,182,212,0.15)' }, { offset: 1, color: 'rgba(6,182,212,0)' }] } }, symbol: 'circle', symbolSize: 3 },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      <ChartCard title="社会融资规模月度增量（万亿元）" subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.socialFinancing}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '万亿元', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [{
            type: 'bar', data: socialFinancingData.monthlyValue.slice(s1, e1),
            itemStyle: { color: (p: any) => p.value >= 0 ? 'rgba(6,182,212,0.7)' : 'rgba(239,68,68,0.7)', borderRadius: [3, 3, 0, 0] },
            barWidth: '60%',
          }],
          animationDuration: 500,
        }} style={{ height: 360 }} />
      </ChartCard>

      <IndicatorExplanation
        title="社会融资规模指标说明"
        items={[
          { label: '指标定义', content: '社会融资规模增量指一定时期内实体经济从金融体系获得的资金总额，包括人民币贷款、外币贷款、委托贷款、信托贷款、未贴现银行承兑汇票、企业债券、政府债券、非金融企业股票融资等。' },
          { label: '数据来源', content: '中国人民银行（www.pbc.gov.cn），每月中旬公布。' },
          { label: '指标意义', content: '社融是实体经济的"晴雨表"，反映金融对实体经济的支持力度。增量>3万亿表明金融支持有力。' },
        ]}
      />
    </div>
  );
}

export default SocialFinancingModule;
