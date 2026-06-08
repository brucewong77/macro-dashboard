import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, retailData, getIndexRange } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';

export function RetailModule() {
  const dr1 = useChartDateRange(2023, 4, 2026, 3);
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1.startStr, dr1.endStr]);
  const fm1 = useMemo(() => months.slice(s1, e1), [s1, e1]);

  return (
    <div className="space-y-4">
      <ChartCard title="社会消费品零售总额同比增速" subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.retail}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [{ type: 'line', data: retailData.yoy.slice(s1, e1), smooth: true, lineStyle: { color: '#f59e0b', width: 2 }, itemStyle: { color: '#f59e0b' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(245,158,11,0.15)' }, { offset: 1, color: 'rgba(245,158,11,0)' }] } }, symbol: 'circle', symbolSize: 3 }],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="px-4 py-2.5 border-b border-[#f1f5f9]">
          <h3 className="text-sm font-semibold text-[#1e293b]">限额以上单位商品零售分行业同比增速</h3>
          <p className="text-[10px] text-[#94a3b8]">{DATA_SOURCES.retail}</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-3">
            {retailData.byIndustry.map(item => (
              <div key={item.name} className="flex items-center justify-between bg-[#f8fafc] rounded-lg px-3 py-2.5">
                <span className="text-sm text-[#334155]">{item.name}</span>
                <span className={`text-base font-bold tabular-nums ${item.yoy >= 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                  {item.yoy >= 0 ? `+${item.yoy}%` : `${item.yoy}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <IndicatorExplanation
        title="社会消费品零售总额指标说明"
        items={[
          { label: '指标定义', content: '社会消费品零售总额指企业（单位、个体户）通过交易售给个人、社会集团非生产、非经营用的实物商品金额，以及提供餐饮服务所取得的收入金额。' },
          { label: '数据来源', content: '国家统计局（www.stats.gov.cn），每月中旬公布上月数据。' },
          { label: '指标意义', content: '社零是衡量消费景气度的核心指标，占GDP比重约40%。增速>8%表明消费旺盛，<3%需关注消费疲软。' },
        ]}
      />
    </div>
  );
}

export default RetailModule;
