import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { months, cpiData, ppiData, pmiData, exportData, importData, retailData, industrialData, faiData, realestateData, getIndexRange } from '../data/economicData';

// 截至2026-06-10各指标最新发布月份
const PUBLISHED_TO: Record<string, string> = {
  'cpi': '2026-05', 'ppi': '2026-05', 'pmi': '2026-05', 'trade': '2026-05',
  'retail': '2026-05', 'industrial': '2026-05', 'fai': '2026-04',
  'realestate': '2026-04', 'sf': '2026-05', 'fx': '2026-05',
  'unemployment': '2026-05', 'default': '2026-04',
};

function shouldShow(month: string, indicator: string): boolean {
  const latest = PUBLISHED_TO[indicator] || PUBLISHED_TO.default;
  return month <= latest;
}

// 近12个月有效数据索引（最新月份为当前月份的上一个月）
function getLast12WithData(): { index: number; month: string }[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 当前月份 1-12
  // 最新月份 = 当前月份的上一个月
  let latestYear = year;
  let latestMonth = month - 1;
  if (latestMonth <= 0) { latestYear = year - 1; latestMonth = 12; }
  const latestStr = `${latestYear}-${String(latestMonth).padStart(2, '0')}`;

  const latestIdx = months.indexOf(latestStr);
  if (latestIdx === -1) {
    // 如果找不到，fallback 到最后一个月
    const total = months.length;
    const result: { index: number; month: string }[] = [];
    for (let i = total - 1; i >= Math.max(0, total - 12); i--) {
      result.push({ index: i, month: months[i] });
    }
    return result;
  }

  const result: { index: number; month: string }[] = [];
  for (let i = latestIdx; i >= Math.max(0, latestIdx - 11); i--) {
    result.push({ index: i, month: months[i] });
  }
  return result;
}

// 读取数据的公共函数
function getVal(arr: number[], idx: number): number | null {
  if (idx < 0 || idx >= arr.length) return null;
  const v = arr[idx];
  if (v === null || v === undefined) return null;
  return v;
}

// 获取显示值：已发布的显示真实数据(包括0)，未发布显示null

// 纯 SVG 迷你折线图 - 无需 echarts，首屏立即可渲染
// 每个指标使用自己的纵坐标范围，尽可能体现波动
function SvgMiniChart({ data, color, name }: { data: number[]; color: string; name: string }) {
  const width = 160;
  const height = 80;
  const padding = 8;
  const validData = data.filter(v => v !== null && v !== undefined);
  if (validData.length === 0) return null;

  // 根据数据实际范围计算纵坐标，留20%边距，充分体现波动
  const dataMin = Math.min(...validData);
  const dataMax = Math.max(...validData);
  const margin = Math.max((dataMax - dataMin) * 0.2, 0.5);
  const minVal = Math.floor((dataMin - margin) * 10) / 10;
  const maxVal = Math.ceil((dataMax + margin) * 10) / 10;
  const range = maxVal - minVal;

  const points = validData.map((v, i) => {
    const x = padding + (i / (validData.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - minVal) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const zeroY = height - padding - ((0 - minVal) / range) * (height - padding * 2);
  const lastVal = validData[validData.length - 1];
  const arrow = lastVal >= 0 ? '↗' : '↘';

  // Y轴刻度标签（只显示最小值、中间值、最大值）
  const yTicks = [minVal, (minVal + maxVal) / 2, maxVal];

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-bold text-[#475569] mb-1">{name}</div>
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          {/* 零线 */}
          {minVal <= 0 && maxVal >= 0 && (
            <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="2,2" />
          )}
          {/* 背景网格线 */}
          {yTicks.map(t => {
            const y = height - padding - ((t - minVal) / range) * (height - padding * 2);
            return (
              <line key={t} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeWidth={1} />
            );
          })}
          {/* 折线 */}
          <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {/* 数据点 */}
          {validData.map((v, i) => {
            const x = padding + (i / (validData.length - 1)) * (width - padding * 2);
            const y = height - padding - ((v - minVal) / range) * (height - padding * 2);
            return <circle key={i} cx={x} cy={y} r={2} fill={color} />;
          })}
          {/* 最新值标签 */}
          <text x={width - padding + 4} y={height - padding - ((lastVal - minVal) / range) * (height - padding * 2) + 4} fontSize={10} fill={color} fontWeight="bold">
            {arrow} {lastVal.toFixed(1)}
          </text>
        </svg>
        {/* Y轴刻度 */}
        <div className="absolute -left-1 top-0 bottom-0 flex flex-col justify-between text-[9px] text-[#94a3b8] leading-none pointer-events-none" style={{ paddingTop: padding, paddingBottom: padding }}>
          <span>{maxVal.toFixed(1)}</span>
          <span>{((minVal + maxVal) / 2).toFixed(1)}</span>
          <span>{minVal.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

// 概览图表区域 - 6个迷你 SVG 折线图
function OverviewCharts() {
  const [, e] = useMemo(() => getIndexRange(months, '2025-05', '2026-04'), []);
  const sliceStart = Math.max(e - 12, 0);
  const sliceEnd = e;

  const indicators = [
    { name: 'CPI', data: cpiData.yoy.slice(sliceStart, sliceEnd), color: '#ef4444' },
    { name: 'PPI', data: ppiData.yoy.slice(sliceStart, sliceEnd), color: '#2563eb' },
    { name: '出口', data: exportData.yoy.slice(sliceStart, sliceEnd), color: '#f59e0b' },
    { name: '社零', data: retailData.yoy.slice(sliceStart, sliceEnd), color: '#8b5cf6' },
    { name: '固投', data: faiData.accumYoy.slice(sliceStart, sliceEnd), color: '#22c55e' },
    { name: '房地产', data: realestateData.salesAreaAccumYoy.slice(sliceStart, sliceEnd), color: '#06b6d4' },
  ];

  return (
    <div className="grid grid-cols-6 gap-2">
      {indicators.map(ind => (
        <SvgMiniChart key={ind.name} data={ind.data} color={ind.color} name={ind.name} />
      ))}
    </div>
  );
}

function DataTable({ isYoy }: { isYoy: boolean }) {
  const last12 = useMemo(() => getLast12WithData(), []);

  // 同比指标
  const yoyRows = [
    { label: 'CPI', data: cpiData.yoy, indicator: 'cpi' },
    { label: '核心CPI', data: cpiData.coreYoy, indicator: 'cpi' },
    { label: 'PPI', data: ppiData.yoy, indicator: 'ppi' },
    { label: '制造业PMI', data: pmiData.manufacturing, indicator: 'pmi' },
    { label: '出口', data: exportData.yoy, indicator: 'trade' },
    { label: '进口', data: importData.yoy, indicator: 'trade' },
    { label: '工业增加值', data: industrialData.yoy, indicator: 'industrial' },
    { label: '社零', data: retailData.yoy, indicator: 'retail' },
    { label: '固投累计', data: faiData.accumYoy, indicator: 'fai' },
    { label: '房地产销售', data: realestateData.salesAreaAccumYoy, indicator: 'realestate' },
  ];

  // 环比指标
  const momRows = [
    { label: 'CPI', data: cpiData.mom, indicator: 'cpi' },
    { label: '核心CPI', data: cpiData.coreMom, indicator: 'cpi' },
    { label: 'PPI', data: ppiData.mom, indicator: 'ppi' },
    { label: '制造业PMI', data: pmiData.manufacturing, indicator: 'pmi' },
    { label: '社零', data: retailData.yoy, indicator: 'retail' },
    { label: '房地产销售', data: realestateData.salesAreaAccumYoy, indicator: 'realestate' },
  ];

  const rows = isYoy ? yoyRows : momRows;

  // 对PMI指标，数据处理方式不同（不是百分比变化，是绝对值）
  const cellClass = "px-2 py-1.5 text-xs tabular-nums whitespace-nowrap";
  const headerClass = "px-2 py-1.5 text-xs font-medium text-[#64748b] whitespace-nowrap";

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[#e2e8f0]">
            <th className={`${headerClass} text-left sticky left-0 bg-white z-10`}>指标</th>
            {last12.map(({ month }) => (
              <th key={month} className={`${headerClass} text-right`}>{month.replace('-', '.')}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row.label} className={`border-b border-[#f1f5f9] ${ri % 2 === 1 ? 'bg-[#fafbfc]' : ''}`}>
              <td className={`${cellClass} text-left font-medium text-[#1e293b] sticky left-0 ${ri % 2 === 1 ? 'bg-[#fafbfc]' : 'bg-white'} z-10`}>{row.label}</td>
              {last12.map(({ index, month }, ci) => {
                const raw = getVal(row.data, index);
                const show = shouldShow(month, row.indicator);
                const display = raw !== null && show ? raw.toFixed(1) + (row.label === '制造业PMI' ? '' : '%') : '未发布';

                if (display === '未发布' || display === '—') {
                  return (
                    <td key={month} className={`${cellClass} text-right ${display === '未发布' ? 'text-[#94a3b8]' : 'text-[#cbd5e1]'}`}>
                      {display}
                    </td>
                  );
                }

                // 最左列（最新月份）：保持原来的样式——跟最右侧(ci=11)索引值比较，变大红变小绿，带箭头，不变黑色
                if (ci === 0) {
                  let arrow = '';
                  let colorClass = 'text-[#1e293b]';
                  const prevIdx = last12[1]?.index;
                  if (prevIdx !== undefined) {
                    const prevRaw = getVal(row.data, prevIdx);
                    if (prevRaw !== null) {
                      if (raw! > prevRaw) { colorClass = 'text-[#ef4444]'; arrow = ' ↑'; }
                      else if (raw! < prevRaw) { colorClass = 'text-[#22c55e]'; arrow = ' ↓'; }
                    }
                  }
                  return (
                    <td key={month} className={`${cellClass} text-right ${colorClass}`}>
                      {display}{arrow && <span>{arrow}</span>}
                    </td>
                  );
                }

                // 最右列（最远月份）：黑色
                if (ci === last12.length - 1) {
                  return (
                    <td key={month} className={`${cellClass} text-right text-[#1e293b]`}>
                      {display}
                    </td>
                  );
                }

                // 中间列：对比左边列（前一个月，即索引小的方向），变大红变小绿
                // 注意：last12 时间从左到右递减，左边(ci+1)是更早的月份
                // 对比"前一个月"：ci 对比 ci+1（它的右边）
                let colorClass = 'text-[#1e293b]';
                if (raw !== null && show) {
                  const prevIdx = last12[ci + 1]?.index;
                  if (prevIdx !== undefined) {
                    const prevRaw = getVal(row.data, prevIdx);
                    if (prevRaw !== null) {
                      if (raw > prevRaw) colorClass = 'text-[#ef4444]';
                      else if (raw < prevRaw) colorClass = 'text-[#22c55e]';
                    }
                  }
                }

                return (
                  <td key={month} className={`${cellClass} text-right ${colorClass}`}>
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OverviewModule() {
  const analysisMonth = '2026年4月';

  return (
    <div className="space-y-4">
      {/* 第一个模块：经济解读 - 立即渲染 */}
      <ChartCard title={`${analysisMonth} 宏观经济数据解读`}>
        <div className="text-sm text-[#334155] leading-relaxed space-y-2">
          <p>{analysisMonth}，宏观经济运行总体平稳。物价温和回升，CPI同比上涨1.2%，PPI同比上涨2.8%（降幅持续收窄）。制造业PMI为50.3%保持扩张区间。出口总值同比增长8.5%，保持较强韧性。4月部分数据已公布，5月数据尚在陆续发布中，请关注后续更新。</p>
        </div>
      </ChartCard>

      {/* 第二个模块：近12个月同比变化表格 */}
      <ChartCard title="近12个月主要指标同比变化情况">
        <DataTable isYoy={true} />
      </ChartCard>

      {/* 第三个模块：近12个月指标趋势（纯 SVG，无需 echarts） */}
      <ChartCard title="近12个月主要指标同比增速趋势">
        <OverviewCharts />
      </ChartCard>
    </div>
  );
}

export default OverviewModule;
