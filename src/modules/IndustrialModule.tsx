import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, industrialData, getIndexRange } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';

export function IndustrialModule() {
  const dr1 = useChartDateRange(2023, 4, 2026, 5);
  const dr2 = useChartDateRange(2024, 4, 2026, 5);
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1.startStr, dr1.endStr]);
  const [s2, e2] = useMemo(() => getIndexRange(months, dr2.startStr, dr2.endStr), [dr2.startStr, dr2.endStr]);
  const fm1 = useMemo(() => months.slice(s1, e1), [s1, e1]);
  const fm2 = useMemo(() => months.slice(s2, e2), [s2, e2]);

  // 近12个月用于表格
  const recentEnd = months.length;
  const recentStart = Math.max(recentEnd - 12, 0);
  const recentMonths = useMemo(() => months.slice(recentStart, recentEnd), []);

  return (
    <div className="space-y-4">
      {/* 同比折线图 */}
      <ChartCard title="工业增加值同比情况" subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.industrial}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [{ type: 'line', data: industrialData.yoy.slice(s1, e1), smooth: true, lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59,130,246,0.15)' }, { offset: 1, color: 'rgba(59,130,246,0)' }] } }, symbol: 'circle', symbolSize: 3 }],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      {/* 环比柱状图 */}
      <ChartCard title="工业增加值环比增速" subtitle={`${dr2.startStr} ~ ${dr2.endStr} | ${DATA_SOURCES.industrial}`} dateRange={dr2}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm2, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [{
            type: 'bar', data: industrialData.mom.slice(s2, e2),
            itemStyle: { color: (p: any) => p.value >= 0 ? 'rgba(59,130,246,0.7)' : 'rgba(239,68,68,0.7)', borderRadius: [3, 3, 0, 0] },
            barWidth: '60%',
          }],
          animationDuration: 500,
        }} style={{ height: 360 }} />
      </ChartCard>

      {/* 细分行业同比增速表格 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="px-4 py-2.5 border-b border-[#f1f5f9]">
          <h3 className="text-sm font-semibold text-[#1e293b]">主要行业工业增加值同比增速（近12个月）</h3>
          <p className="text-[10px] text-[#94a3b8]">{DATA_SOURCES.industrial}</p>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">行业</th>
                  {recentMonths.map(m => (
                    <th key={m} className="border border-[#e2e8f0] px-1.5 py-1.5 text-center text-[#475569] font-semibold min-w-[52px]">{m.slice(2)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {industrialData.industryYoy.map((industry, ri) => (
                  <tr key={industry.name} className={ri % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                    <td className="border border-[#e2e8f0] px-2 py-1 text-[#334155] font-medium sticky left-0 bg-inherit">{industry.name}</td>
                    {industry.values.slice(recentStart, recentEnd).map((v, ci) => (
                      <td key={ci} className="border border-[#e2e8f0] px-1 py-1 text-center tabular-nums" style={{ color: v >= 0 ? '#ef4444' : '#22c55e' }}>
                        {v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 新动能产品增速 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="px-4 py-2.5 border-b border-[#f1f5f9]">
          <h3 className="text-sm font-semibold text-[#1e293b]">新动能产品产量同比增速</h3>
          <p className="text-[10px] text-[#94a3b8]">{DATA_SOURCES.industrial}</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-3">
            {industrialData.emergingProducts.map(p => (
              <div key={p.name} className="flex items-center justify-between bg-[#f8fafc] rounded-lg px-4 py-3">
                <span className="text-sm text-[#334155]">{p.name}</span>
                <span className={`text-lg font-bold tabular-nums ${p.yoy >= 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                  {p.yoy >= 0 ? `+${p.yoy}%` : `${p.yoy}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 指标说明 */}
      <IndicatorExplanation
        title="工业增加值指标说明"
        items={[
          { label: '指标定义', content: '工业增加值是指工业企业在报告期内以货币形式表现的工业生产活动的最终成果，是企业全部生产活动的总成果扣除了在生产过程中消耗或转移的物质产品和劳务价值后的余额。' },
          { label: '计算方式', content: '采用生产法计算：工业增加值=工业总产值-工业中间投入+应交增值税。同比增速为名义增速，扣除价格因素后为实际增速。' },
          { label: '数据来源', content: '国家统计局（www.stats.gov.cn），每月中旬公布上月数据。' },
          { label: '指标意义', content: '工业增加值占GDP比重约30%，是经济增长的核心指标。增速>6%表明工业运行良好，<4%需关注下行风险。' },
        ]}
      />
    </div>
  );
}

export default IndustrialModule;
