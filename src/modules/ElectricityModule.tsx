import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, electricityData, getIndexRange } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';

export function ElectricityModule() {
  const dr1 = useChartDateRange(2024, 4, 2026, 3);
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1.startStr, dr1.endStr]);
  const fm1 = useMemo(() => months.slice(s1, e1), [s1, e1]);

  // 近12个月用于表格
  const recentEnd = months.length;
  const recentStart = Math.max(recentEnd - 12, 0);
  const recentMonths = useMemo(() => months.slice(recentStart, recentEnd), []);

  return (
    <div className="space-y-4">
      {/* 全社会用电量总量 */}
      <ChartCard title="全社会用电量" subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.electricity}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 60 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '亿千瓦时', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [{ type: 'line', data: electricityData.total.slice(s1, e1), smooth: true, lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59,130,246,0.15)' }, { offset: 1, color: 'rgba(59,130,246,0)' }] } }, symbol: 'circle', symbolSize: 3 }],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      {/* 用电量同比增速 */}
      <ChartCard title="全社会用电量同比增速" subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.electricity}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [
            { type: 'line', data: electricityData.yoy.slice(s1, e1), smooth: true, lineStyle: { color: '#f59e0b', width: 2 }, itemStyle: { color: '#f59e0b' }, symbol: 'circle', symbolSize: 3 },
          ],
          animationDuration: 500,
        }} style={{ height: 360 }} />
      </ChartCard>

      {/* 分产业用电量同比增速表格 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="px-4 py-2.5 border-b border-[#f1f5f9]">
          <h3 className="text-sm font-semibold text-[#1e293b]">分产业用电量同比增速（近12个月）</h3>
          <p className="text-[10px] text-[#94a3b8]">{DATA_SOURCES.electricity}</p>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">产业</th>
                  {recentMonths.map(m => (
                    <th key={m} className="border border-[#e2e8f0] px-1.5 py-1.5 text-center text-[#475569] font-semibold min-w-[52px]">{m.slice(2)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: '第一产业', data: electricityData.byIndustry.primary },
                  { name: '第二产业', data: electricityData.byIndustry.secondary },
                  { name: '第三产业', data: electricityData.byIndustry.tertiary },
                ].map((row, ri) => (
                  <tr key={row.name} className={ri % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                    <td className="border border-[#e2e8f0] px-2 py-1 text-[#334155] font-medium sticky left-0 bg-inherit">{row.name}</td>
                    {row.data.slice(recentStart, recentEnd).map((v, ci) => (
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

      {/* 指标说明 */}
      <IndicatorExplanation
        title="全社会用电量指标说明"
        items={[
          { label: '指标定义', content: '全社会用电量指全社会在报告期内消耗的电能量，包括第一产业、第二产业、第三产业和居民生活用电量。' },
          { label: '计算方式', content: '由电网企业计量统计，按产业和用途分类汇总。单位：亿千瓦时。' },
          { label: '数据来源', content: '国家能源局（www.nea.gov.cn）和中国电力企业联合会，每月中旬公布上月数据。' },
          { label: '指标意义', content: '用电量被称为经济"晴雨表"，与GDP增速高度相关。第二产业用电占比约65%，最能反映工业景气度。' },
        ]}
      />
    </div>
  );
}

export default ElectricityModule;
