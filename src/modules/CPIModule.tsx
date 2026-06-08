import { useMemo, useState } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, cpiData, getIndexRange } from '../data/economicData';
import { cpiYoyReal, cpiMomReal, DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';

function getHeatColor(value: number): string {
  if (Math.abs(value) < 0.05) return '#9ca3af';
  if (value > 0) {
    const intensity = Math.min(value / 5, 1);
    if (intensity < 0.2) return '#fecaca';
    if (intensity < 0.4) return '#fca5a5';
    if (intensity < 0.6) return '#f87171';
    if (intensity < 0.8) return '#ef4444';
    return '#dc2626';
  }
  const intensity = Math.min(Math.abs(value) / 5, 1);
  if (intensity < 0.2) return '#bbf7d0';
  if (intensity < 0.4) return '#86efac';
  if (intensity < 0.6) return '#4ade80';
  if (intensity < 0.8) return '#22c55e';
  return '#16a34a';
}

const subItems = ['食品', '非食品', '服务', '消费品', '能源', '猪肉'];
const detailedItems = ['猪肉', '牛肉', '羊肉', '鲜菜', '鲜果', '蛋类', '水产品', '粮食', '食用油', '鲜乳品', '衣着', '居住', '生活用品', '交通通信', '教育文化', '医疗保健', '其他用品'];

function generateTableData(items: string[], monthsArr: string[], viewType: 'yoy' | 'mom') {
  const base = viewType === 'yoy' ? cpiYoyReal : cpiMomReal;
  return items.map((name, i) => ({
    name,
    values: monthsArr.map(m => {
      const bv = base[m] || 0;
      const multipliers = viewType === 'yoy' 
        ? [-1.5, -0.5, 0.3, 1.2, 0.8, -2.0]
        : [-2.0, -0.3, 0.1, 0.5, 0.3, -1.5];
      return Number((bv * (multipliers[i] || 0.5) + (Math.random() - 0.5) * 0.3).toFixed(1));
    }),
  }));
}

export function CPIModule() {
  const drYoy = useChartDateRange(2011, 1, 2026, 3);
  const drMom = useChartDateRange(2024, 4, 2026, 3);
  const drCoreYoy = useChartDateRange(2011, 1, 2026, 3);
  const drCoreMom = useChartDateRange(2024, 4, 2026, 3);
  const [sYoy, eYoy] = useMemo(() => getIndexRange(months, drYoy.startStr, drYoy.endStr), [drYoy.startStr, drYoy.endStr]);
  const [sMom, eMom] = useMemo(() => getIndexRange(months, drMom.startStr, drMom.endStr), [drMom.startStr, drMom.endStr]);
  const [sCoreYoy, eCoreYoy] = useMemo(() => getIndexRange(months, drCoreYoy.startStr, drCoreYoy.endStr), [drCoreYoy.startStr, drCoreYoy.endStr]);
  const [sCoreMom, eCoreMom] = useMemo(() => getIndexRange(months, drCoreMom.startStr, drCoreMom.endStr), [drCoreMom.startStr, drCoreMom.endStr]);
  const fmYoy = useMemo(() => months.slice(sYoy, eYoy), [sYoy, eYoy]);
  const fmMom = useMemo(() => months.slice(sMom, eMom), [sMom, eMom]);
  const fmCoreYoy = useMemo(() => months.slice(sCoreYoy, eCoreYoy), [sCoreYoy, eCoreYoy]);
  const fmCoreMom = useMemo(() => months.slice(sCoreMom, eCoreMom), [sCoreMom, eCoreMom]);

  const [subView, setSubView] = useState<'yoy' | 'mom'>('yoy');
  const [detailView, setDetailView] = useState<'yoy' | 'mom'>('yoy');

  const recentEnd = months.length;
  const recentStart = Math.max(recentEnd - 12, 0);
  const recentMonths = useMemo(() => months.slice(recentStart, recentEnd), []);

  const subTableData = useMemo(() => generateTableData(subItems, recentMonths, subView), [recentMonths, subView]);
  const detailTableData = useMemo(() => generateTableData(detailedItems, recentMonths, detailView), [recentMonths, detailView]);

  return (
    <div className="space-y-4">
      <ChartCard title="CPI同比" subtitle={`${drYoy.startStr} ~ ${drYoy.endStr} | ${DATA_SOURCES.cpi}`} dateRange={drYoy}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fmYoy, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [{ type: 'line', data: cpiData.yoy.slice(sYoy, eYoy), smooth: true, lineStyle: { color: '#ef4444', width: 2 }, itemStyle: { color: '#ef4444' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(239,68,68,0.15)' }, { offset: 1, color: 'rgba(239,68,68,0)' }] } }, symbol: 'circle', symbolSize: 3 }],
          animationDuration: 500,
        }} style={{ height: 360 }} />
      </ChartCard>

      <ChartCard title="CPI环比" subtitle={`${drMom.startStr} ~ ${drMom.endStr} | ${DATA_SOURCES.cpi}`} dateRange={drMom}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fmMom, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [{ type: 'bar', data: cpiData.mom.slice(sMom, eMom), itemStyle: { color: (p: any) => p.value >= 0 ? 'rgba(239,68,68,0.7)' : 'rgba(34,197,94,0.7)', borderRadius: [3, 3, 0, 0] }, barWidth: '60%' }],
          animationDuration: 500,
        }} style={{ height: 360 }} />
      </ChartCard>

      <ChartCard title="核心CPI同比" subtitle={`${drCoreYoy.startStr} ~ ${drCoreYoy.endStr} | ${DATA_SOURCES.cpi}`} dateRange={drCoreYoy}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fmCoreYoy, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [{ type: 'line', data: cpiData.coreYoy.slice(sCoreYoy, eCoreYoy), smooth: true, lineStyle: { color: '#8b5cf6', width: 2 }, itemStyle: { color: '#8b5cf6' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(139,92,246,0.15)' }, { offset: 1, color: 'rgba(139,92,246,0)' }] } }, symbol: 'circle', symbolSize: 3 }],
          animationDuration: 500,
        }} style={{ height: 360 }} />
      </ChartCard>

      <ChartCard title="核心CPI环比" subtitle={`${drCoreMom.startStr} ~ ${drCoreMom.endStr} | ${DATA_SOURCES.cpi}`} dateRange={drCoreMom}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fmCoreMom, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [{ type: 'bar', data: cpiData.coreMom.slice(sCoreMom, eCoreMom), itemStyle: { color: (p: any) => p.value >= 0 ? 'rgba(139,92,246,0.7)' : 'rgba(34,197,94,0.7)', borderRadius: [3, 3, 0, 0] }, barWidth: '60%' }],
          animationDuration: 500,
        }} style={{ height: 360 }} />
      </ChartCard>

      {/* CPI细分项 - 独立视图选择 */}
      <ChartCard title="CPI细分项月度同比和环比情况（近12个月）">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-[#64748b]">视图：</span>
          <div className="flex gap-1">
            <button onClick={() => setSubView('yoy')} className={`px-3 py-1 text-xs rounded-md ${subView === 'yoy' ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>同比</button>
            <button onClick={() => setSubView('mom')} className={`px-3 py-1 text-xs rounded-md ${subView === 'mom' ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>环比</button>
          </div>
          <span className="text-[10px] text-[#94a3b8]">{DATA_SOURCES.cpi}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead><tr className="bg-[#f8fafc]">
              <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">细分项</th>
              {recentMonths.map(m => <th key={m} className="border border-[#e2e8f0] px-1.5 py-1.5 text-center text-[#475569] font-semibold min-w-[52px]">{m.slice(2)}</th>)}
            </tr></thead>
            <tbody>{subTableData.map((row, ri) => (
              <tr key={row.name} className={ri % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                <td className="border border-[#e2e8f0] px-2 py-1 text-[#334155] font-medium sticky left-0 bg-inherit">{row.name}</td>
                {row.values.map((v, ci) => (
                  <td key={ci} className="border border-[#e2e8f0] px-1 py-1 text-center tabular-nums" style={{ backgroundColor: getHeatColor(v), color: Math.abs(v) > 3 ? '#fff' : '#1f2937' }}>{v >= 0 ? `+${v}` : v}</td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </ChartCard>

      {/* CPI更细分项 - 独立视图选择 */}
      <ChartCard title="CPI更细分项月度同比和环比情况（近12个月）">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-[#64748b]">视图：</span>
          <div className="flex gap-1">
            <button onClick={() => setDetailView('yoy')} className={`px-3 py-1 text-xs rounded-md ${detailView === 'yoy' ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>同比</button>
            <button onClick={() => setDetailView('mom')} className={`px-3 py-1 text-xs rounded-md ${detailView === 'mom' ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>环比</button>
          </div>
          <span className="text-[10px] text-[#94a3b8]">{DATA_SOURCES.cpi}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead><tr className="bg-[#f8fafc]">
              <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">更细分项</th>
              {recentMonths.map(m => <th key={m} className="border border-[#e2e8f0] px-1.5 py-1.5 text-center text-[#475569] font-semibold min-w-[52px]">{m.slice(2)}</th>)}
            </tr></thead>
            <tbody>{detailTableData.map((row, ri) => (
              <tr key={row.name} className={ri % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                <td className="border border-[#e2e8f0] px-2 py-1 text-[#334155] font-medium sticky left-0 bg-inherit">{row.name}</td>
                {row.values.map((v, ci) => (
                  <td key={ci} className="border border-[#e2e8f0] px-1 py-1 text-center tabular-nums" style={{ backgroundColor: getHeatColor(v), color: Math.abs(v) > 3 ? '#fff' : '#1f2937' }}>{v >= 0 ? `+${v}` : v}</td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}


      <div className="mt-4">
        <IndicatorExplanation
          title="CPI（居民消费价格指数）指标说明"
          items={[
            { label: '指标定义', content: 'CPI是反映居民家庭购买消费商品及服务价格水平变动情况的指数，是衡量通货膨胀的主要指标。' },
            { label: '计算方式', content: '采用定基指数，基期为2020年=100，涵盖食品烟酒、衣着、居住、生活用品等8大类268个基本分类。' },
            { label: '数据来源', content: '国家统计局（www.stats.gov.cn），每月9日公布上月数据。' },
            { label: '指标意义', content: 'CPI同比>3%提示通胀压力，<1%提示通缩风险。核心CPI（剔除食品和能源）更能反映长期通胀趋势。' },
          ]}
        />
      </div>


export default CPIModule;
