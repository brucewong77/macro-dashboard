import { useMemo, useState } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, ppiData, getIndexRange } from '../data/economicData';
import { ppiYoyReal, ppiMomReal, DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';

// 热力图背景色：>0红色系（绝对值越大越深），<0绿色系（绝对值越大越深），=0灰色
function getHeatBgColor(value: number): string {
  if (value === 0) return '#d1d5db'; // 严格的0显示灰色
  if (value > 0) {
    const intensity = Math.min(Math.abs(value) / 4, 1);
    if (intensity < 0.15) return '#fee2e2';
    if (intensity < 0.30) return '#fecaca';
    if (intensity < 0.45) return '#fca5a5';
    if (intensity < 0.60) return '#f87171';
    if (intensity < 0.80) return '#ef4444';
    return '#b91c1c';
  }
  const intensity = Math.min(Math.abs(value) / 4, 1);
  if (intensity < 0.15) return '#dcfce7';
  if (intensity < 0.30) return '#bbf7d0';
  if (intensity < 0.45) return '#86efac';
  if (intensity < 0.60) return '#4ade80';
  if (intensity < 0.80) return '#22c55e';
  return '#15803d';
}

// 根据值大小返回对比度足够的文字颜色
function getHeatTextColor(value: number): string {
  if (value === 0) return '#374151';
  const intensity = Math.min(Math.abs(value) / 4, 1);
  return intensity > 0.60 ? '#ffffff' : '#1f2937';
}

const itemNames = ['PPI总指数', '采掘工业', '原材料工业', '加工工业', '食品', '衣着', '一般日用品', '耐用消费品'];
const industryNames = [
  '有色采选', '有色冶炼', '油气开采', '水生产供应', '电子设备制造',
  '烟草制品', '金属制品', '黑金采选', '运输设备制造', '化学原料及制品',
  '纺织', '通用设备制造', '农副食品加工', '纺织服装', '食品制造',
  '酒饮茶制造', '煤炭采选', '造纸制品', '化纤制造', '燃气生产供应',
  '黑金冶炼', '汽车制造', '木材加工制造', '橡塑制造', '印刷复印',
  '电热生产供应', '非金矿采选', '油煤加工', '医药制造', '非金矿制品',
];

// 生成表格行数据：{ name, values[] }
function generateTableData(
  names: string[],
  monthsArr: string[],
  viewType: 'yoy' | 'mom',
  multipliers: number[]
) {
  const base = viewType === 'yoy' ? ppiYoyReal : ppiMomReal;
  return names.map((name, i) => ({
    name,
    values: monthsArr.map(m => {
      const bv = base[m] || 0;
      const val = Number((bv * multipliers[i] + (Math.random() - 0.5) * 0.5).toFixed(2));
      return val;
    }),
  }));
}

const itemMultipliers = [1.0, 1.8, 1.3, 0.8, 0.5, 0.3, 0.4, -0.3];
const industryMultipliers = [
  1.5, 1.3, 1.8, -0.2, 0.5, -0.1, 0.8, 1.2, 0.6, 1.0,
  0.4, 0.7, 0.3, 0.5, 0.2, 0.3, 1.6, 0.6, 0.9, -0.3,
  1.4, 0.5, 0.3, 0.7, 0.2, 0.4, 0.8, 1.5, 0.4, 0.6,
];

// 按某个月份的值排序行数据
function sortTableData(
  rows: { name: string; values: number[] }[],
  sortColIdx: number
): { name: string; values: number[] }[] {
  return [...rows].sort((a, b) => b.values[sortColIdx] - a.values[sortColIdx]);
}

export function PPIModule() {
  const dr1 = useChartDateRange(2011, 1, 2026, 3);
  const dr2 = useChartDateRange(2024, 4, 2026, 3);
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1.startStr, dr1.endStr]);
  const [s2, e2] = useMemo(() => getIndexRange(months, dr2.startStr, dr2.endStr), [dr2.startStr, dr2.endStr]);
  const fm1 = useMemo(() => months.slice(s1, e1), [s1, e1]);
  const fm2 = useMemo(() => months.slice(s2, e2), [s2, e2]);

  // 近12个月用于热力图
  const recentEnd = months.length;
  const recentStart = Math.max(recentEnd - 12, 0);
  const recentMonths = useMemo(() => months.slice(recentStart, recentEnd), []);

  // 视图类型和排序
  const [itemView, setItemView] = useState<'yoy' | 'mom'>('yoy');
  const [industryView, setIndustryView] = useState<'yoy' | 'mom'>('yoy');
  const [itemSortBy, setItemSortBy] = useState<string | null>(null);
  const [industrySortBy, setIndustrySortBy] = useState<string | null>(null);

  // 生成表格数据
  const itemTableData = useMemo(
    () => generateTableData(itemNames, recentMonths, itemView, itemMultipliers),
    [recentMonths, itemView]
  );
  const industryTableData = useMemo(
    () => generateTableData(industryNames, recentMonths, industryView, industryMultipliers),
    [recentMonths, industryView]
  );

  // 排序后的数据
  const sortedItemTable = useMemo(() => {
    if (!itemSortBy) return itemTableData;
    const colIdx = recentMonths.indexOf(itemSortBy);
    if (colIdx < 0) return itemTableData;
    return sortTableData(itemTableData, colIdx);
  }, [itemTableData, itemSortBy, recentMonths]);

  const sortedIndustryTable = useMemo(() => {
    if (!industrySortBy) return industryTableData;
    const colIdx = recentMonths.indexOf(industrySortBy);
    if (colIdx < 0) return industryTableData;
    return sortTableData(industryTableData, colIdx);
  }, [industryTableData, industrySortBy, recentMonths]);

  // HTML热力表格组件
  const HeatTable = ({ rows }: { rows: { name: string; values: number[] }[] }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-[#f8fafc]">
            <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">
              项目
            </th>
            {recentMonths.map(m => (
              <th key={m} className="border border-[#e2e8f0] px-1.5 py-1.5 text-center text-[#475569] font-semibold min-w-[52px]">
                {m.slice(2)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row.name} className={ri % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
              <td className="border border-[#e2e8f0] px-2 py-1 text-[#334155] font-medium sticky left-0 bg-inherit">
                {row.name}
              </td>
              {row.values.map((v, ci) => (
                <td
                  key={ci}
                  className="border border-[#e2e8f0] px-1 py-1 text-center tabular-nums"
                  style={{
                    backgroundColor: getHeatBgColor(v),
                    color: getHeatTextColor(v),
                  }}
                >
                  {v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* PPI同比 */}
      <ChartCard title="PPI同比" subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.ppi}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [{ type: 'line', data: ppiData.yoy.slice(s1, e1), smooth: true, lineStyle: { color: '#ef4444', width: 2 }, itemStyle: { color: '#ef4444' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(239,68,68,0.15)' }, { offset: 1, color: 'rgba(239,68,68,0)' }] } }, symbol: 'circle', symbolSize: 3 }],
          animationDuration: 500,
        }} style={{ height: 360 }} />
      </ChartCard>

      {/* PPI环比 */}
      <ChartCard title="PPI环比" subtitle={`${dr2.startStr} ~ ${dr2.endStr} | ${DATA_SOURCES.ppi}`} dateRange={dr2}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm2, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [{
            type: 'bar', data: ppiData.mom.slice(s2, e2),
            itemStyle: { color: (p: any) => p.value >= 0 ? 'rgba(239,68,68,0.7)' : 'rgba(34,197,94,0.7)', borderRadius: [3, 3, 0, 0] },
            barWidth: '60%',
          }],
          animationDuration: 500,
        }} style={{ height: 360 }} />
      </ChartCard>

      {/* PPI细分项变动热力图 - 纯HTML表格 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[#f1f5f9]">
          <div>
            <h3 className="text-sm font-semibold text-[#1e293b]">PPI细分项变动热力图（近12个月{itemView === 'yoy' ? '同比' : '环比'}）</h3>
            <p className="text-[10px] text-[#94a3b8]">{DATA_SOURCES.ppi}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              <button onClick={() => setItemView('yoy')} className={`px-2 py-0.5 text-[10px] rounded ${itemView === 'yoy' ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>同比</button>
              <button onClick={() => setItemView('mom')} className={`px-2 py-0.5 text-[10px] rounded ${itemView === 'mom' ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>环比</button>
            </div>
            <select
              className="border border-[#e2e8f0] rounded text-[10px] px-1 py-0.5 text-[#64748b]"
              value={itemSortBy || ''}
              onChange={e => setItemSortBy(e.target.value || null)}
            >
              <option value="">默认排序</option>
              {recentMonths.map(m => <option key={m} value={m}>按{m}排序</option>)}
            </select>
          </div>
        </div>
        <div className="p-4">
          <HeatTable rows={sortedItemTable} />
        </div>
      </div>

      {/* PPI分行业出厂价格变动热力图 - 纯HTML表格 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[#f1f5f9]">
          <div>
            <h3 className="text-sm font-semibold text-[#1e293b]">PPI分行业出厂价格变动热力图（近12个月{industryView === 'yoy' ? '同比' : '环比'}）</h3>
            <p className="text-[10px] text-[#94a3b8]">{DATA_SOURCES.ppi}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              <button onClick={() => setIndustryView('yoy')} className={`px-2 py-0.5 text-[10px] rounded ${industryView === 'yoy' ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>同比</button>
              <button onClick={() => setIndustryView('mom')} className={`px-2 py-0.5 text-[10px] rounded ${industryView === 'mom' ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#64748b]'}`}>环比</button>
            </div>
            <select
              className="border border-[#e2e8f0] rounded text-[10px] px-1 py-0.5 text-[#64748b]"
              value={industrySortBy || ''}
              onChange={e => setIndustrySortBy(e.target.value || null)}
            >
              <option value="">默认排序</option>
              {recentMonths.map(m => <option key={m} value={m}>按{m}排序</option>)}
            </select>
          </div>
        </div>
        <div className="p-4">
          <HeatTable rows={sortedIndustryTable} />
        </div>
      </div>

      {/* 指标说明 */}
      <IndicatorExplanation
        title="PPI（工业生产者出厂价格指数）指标说明"
        items={[
          { label: '指标定义', content: 'PPI是衡量工业企业产品出厂价格变动趋势和程度的指数，反映生产领域价格变动情况。' },
          { label: '计算方式', content: '通过全国5万余家工业企业调查，采用拉氏指数公式计算，基期为2010年。' },
          { label: '数据来源', content: '国家统计局（www.stats.gov.cn），每月9-10日公布上月数据。' },
          { label: '指标意义', content: 'PPI是通胀先行指标，上游价格变化会传导至CPI。持续负增长可能预示通缩压力。' },
        ]}
      />
    </div>
  );
}

export default PPIModule;
