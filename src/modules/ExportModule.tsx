import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, exportData, getIndexRange } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';

export function ExportModule() {
  const dr1 = useChartDateRange(2023, 4, 2026, 5);
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1.startStr, dr1.endStr]);
  const fm1 = useMemo(() => months.slice(s1, e1), [s1, e1]);

  return (
    <div className="space-y-4">
      <ChartCard title="出口总额同比增速" subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.export}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [{ type: 'line', data: exportData.yoy.slice(s1, e1), smooth: true, lineStyle: { color: '#ef4444', width: 2 }, itemStyle: { color: '#ef4444' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(239,68,68,0.15)' }, { offset: 1, color: 'rgba(239,68,68,0)' }] } }, symbol: 'circle', symbolSize: 3 }],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="出口分国家/地区占比">
          <ReactECharts option={{
            tooltip: { trigger: 'item' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
            series: [{
              type: 'pie', radius: ['40%', '70%'], center: ['50%', '55%'],
              data: exportData.byCountry.map(c => ({ name: c.name, value: c.value })),
              label: { color: '#475569', fontSize: 11, formatter: '{b}\n{d}%' },
              itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
            }],
            color: ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e', '#8b5cf6', '#06b6d4', '#94a3b8'],
            animationDuration: 500,
          }} style={{ height: 320 }} />
        </ChartCard>

        <ChartCard title="出口分产品类别占比">
          <ReactECharts option={{
            tooltip: { trigger: 'item' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
            series: [{
              type: 'pie', radius: ['40%', '70%'], center: ['50%', '55%'],
              data: exportData.byProduct.map(c => ({ name: c.name, value: c.value })),
              label: { color: '#475569', fontSize: 11, formatter: '{b}\n{d}%' },
              itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
            }],
            color: ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e', '#8b5cf6', '#06b6d4', '#94a3b8'],
            animationDuration: 500,
          }} style={{ height: 320 }} />
        </ChartCard>
      </div>

      <IndicatorExplanation
        title="出口指标说明"
        items={[
          { label: '指标定义', content: '出口总额指报告期内实际离开中国关境的货物价值总和，以美元计价。' },
          { label: '数据来源', content: '海关总署（www.customs.gov.cn），每月中旬公布上月数据。' },
          { label: '指标意义', content: '出口是拉动GDP增长的"三驾马车"之一，也是外汇储备的主要来源。出口增速>10%表明外需强劲。' },
        ]}
      />
    </div>
  );
}

export default ExportModule;
