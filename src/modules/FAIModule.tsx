import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, faiData, getIndexRange } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';

export function FAIModule() {
  const dr1 = useChartDateRange(2018, 1, 2026, 5);
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1.startStr, dr1.endStr]);
  const fm1 = useMemo(() => months.slice(s1, e1), [s1, e1]);

  // 近12个月用于表格
  const recentEnd = months.length;
  const recentStart = Math.max(recentEnd - 12, 0);

  return (
    <div className="space-y-4">
      <ChartCard title="固定资产投资累计同比增速" subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.fai}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [
            { type: 'line', data: faiData.accumYoy.slice(s1, e1), smooth: true, name: '固投累计同比', lineStyle: { color: '#8b5cf6', width: 2 }, itemStyle: { color: '#8b5cf6' }, symbol: 'circle', symbolSize: 3 },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="px-4 py-2.5 border-b border-[#f1f5f9]">
          <h3 className="text-sm font-semibold text-[#1e293b]">分领域固定资产投资累计同比增速（近12个月）</h3>
          <p className="text-[10px] text-[#94a3b8]">{DATA_SOURCES.fai}</p>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">领域</th>
                  {months.slice(recentStart, recentEnd).map(m => (
                    <th key={m} className="border border-[#e2e8f0] px-1.5 py-1.5 text-center text-[#475569] font-semibold min-w-[52px]">{m.slice(2)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: '制造业', data: faiData.bySector.manufacturing },
                  { name: '基础设施', data: faiData.bySector.infrastructure },
                  { name: '房地产', data: faiData.bySector.realEstate },
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

      <IndicatorExplanation
        title="固定资产投资指标说明"
        items={[
          { label: '指标定义', content: '固定资产投资（不含农户）是以货币形式表现的在一定时期内完成的建造和购置固定资产的工作量。' },
          { label: '数据来源', content: '国家统计局（www.stats.gov.cn），每月中旬公布。' },
          { label: '指标意义', content: '固投是GDP重要组成部分。制造业投资反映企业信心，基建投资逆周期调节，房地产投资关联产业链广。' },
        ]}
      />
    </div>
  );
}

export default FAIModule;
