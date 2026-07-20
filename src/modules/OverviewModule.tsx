import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { months, cpiData, ppiData, pmiData, exportData, importData, retailData, industrialData, faiData, realestateData, getPrevMonthStr, isPublished } from '../data/economicData';
import { WindIdHover } from '../components/WindIdHover';

/* ─── 概览指标 → Wind ID ─── */
function overviewWindId(label: string): string {
  const map: Record<string, string> = {
    'CPI': 'M0000612', '核心CPI': 'M0085932', 'PPI': 'M0001227',
    '制造业PMI': 'M0017126', '出口': 'M0000607', '进口': 'M0000609',
    '工业增加值': 'M0000545', '社零': 'M0001428',
    '固投累计': 'M0000273', '房地产销售': 'S0049591',
  };
  return map[label] ?? '';
}
/* ─── 环比指标Wind ID（与同比不同时单独标注） ─── */
function overviewWindIdMom(label: string): string {
  const map: Record<string, string> = {
    'CPI': 'M0000706', '核心CPI': 'M0085934',
    'PPI': 'M0000707',
  };
  return map[label] ?? '';
}

// 各指标最新发布月份（截止2026-07-10）
const PUBLISHED_TO: Record<string, string> = {
  'cpi': '2026-06', 'ppi': '2026-06', 'pmi': '2026-06', 'trade': '2026-06',
  'retail': '2026-06', 'industrial': '2026-05', 'fai': '2026-06',
  'realestate': '2026-06', 'sf': '2026-06', 'fx': '2026-06',
  'unemployment': '2026-05', 'default': '2026-05',
};

function shouldShow(month: string, indicator: string): boolean {
  const latest = PUBLISHED_TO[indicator] || PUBLISHED_TO.default;
  return month <= latest;
}

// 近12个月有效数据索引（最新月份为当前月份的上一个月）
function getLast12WithData(): { index: number; month: string }[] {
  const latestStr = getPrevMonthStr();

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

// 纯 SVG 迷你折线图卡片
function SvgMiniChart({ data, color, name }: { data: (number | null)[]; color: string; name: string }) {
  const validData = data.filter((v): v is number => v !== null && v !== undefined);
  if (validData.length === 0) return null;

  // 根据数据实际范围计算纵坐标，留20%边距
  const dataMin = Math.min(...validData);
  const dataMax = Math.max(...validData);
  const margin = Math.max((dataMax - dataMin) * 0.2, 0.5);
  const minVal = Math.floor((dataMin - margin) * 10) / 10;
  const maxVal = Math.ceil((dataMax + margin) * 10) / 10;
  const range = maxVal - minVal;
  const lastVal = validData[validData.length - 1];
  const prevVal = validData.length > 1 ? validData[validData.length - 2] : lastVal;
  const isUp = lastVal >= prevVal;

  // 内边距：左预留Y轴标签，右预留最新值标签
  const pad = { top: 12, bottom: 8, left: 36, right: 44 };
  const svgW = 340, svgH = 120;
  const plotW = svgW - pad.left - pad.right;
  const plotH = svgH - pad.top - pad.bottom;
  const n = validData.length;

  const points = validData.map((v, i) => {
    const x = pad.left + (i / (n - 1)) * plotW;
    const y = pad.top + plotH - ((v - minVal) / range) * plotH;
    return `${x},${y}`;
  }).join(' ');

  const zeroY = pad.top + plotH - ((0 - minVal) / range) * plotH;

  // Y轴刻度（4档）
  const yTicks = [
    { label: maxVal.toFixed(1), y: pad.top },
    { label: ((maxVal + minVal) / 2).toFixed(1), y: pad.top + plotH / 2 },
    { label: minVal.toFixed(1), y: pad.top + plotH },
  ];

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
      {/* 头部：指标名 + 最新值 */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-sm font-semibold text-[#1e293b]">
          <WindIdHover id={overviewWindId(name)}>{name}</WindIdHover>
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`text-lg font-bold ${isUp ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
            {lastVal >= 0 ? '+' : ''}{lastVal.toFixed(1)}%
          </span>
          <span className={`text-xs ${isUp ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
            {isUp ? '↑' : '↓'}
          </span>
        </div>
      </div>
      {/* SVG 图表 */}
      <div className="px-2 pb-2">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto" style={{ maxHeight: svgH }}>
          {/* 网格线 */}
          {yTicks.map(t => (
            <line key={t.label} x1={pad.left} y1={t.y} x2={svgW - pad.right} y2={t.y} stroke="#f1f5f9" strokeWidth={1} />
          ))}
          {/* Y轴标签 */}
          {yTicks.map(t => (
            <text key={t.label} x={pad.left - 4} y={t.y + 3} textAnchor="end" fontSize={10} fill="#94a3b8">
              {t.label}
            </text>
          ))}
          {/* 零线 */}
          {minVal <= 0 && maxVal >= 0 && (
            <line x1={pad.left} y1={zeroY} x2={svgW - pad.right} y2={zeroY} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3,3" />
          )}
          {/* 面积填充 */}
          <defs>
            <linearGradient id={`grad-${name}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.12} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon
            points={`${pad.left},${pad.top + plotH} ${points} ${pad.left + plotW},${pad.top + plotH}`}
            fill={`url(#grad-${name})`}
          />
          {/* 折线 */}
          <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {/* 数据点：只显示首尾 */}
          {[0, n - 1].map(i => {
            const x = pad.left + (i / (n - 1)) * plotW;
            const y = pad.top + plotH - ((validData[i] - minVal) / range) * plotH;
            return <circle key={i} cx={x} cy={y} r={3} fill="#fff" stroke={color} strokeWidth={2} />;
          })}
          {/* 最新值标签 */}
          <text x={svgW - pad.right + 4} y={pad.top + plotH - ((lastVal - minVal) / range) * plotH + 4} fontSize={11} fill={color} fontWeight="bold">
            {lastVal >= 0 ? '+' : ''}{lastVal.toFixed(1)}
          </text>
        </svg>
      </div>
    </div>
  );
}

// 概览图表区域 - 6个迷你 SVG 折线图
function OverviewCharts() {
  const prevMonth = getPrevMonthStr();
  // 找到 prevMonth 在 months 中的索引，往前取12个月
  const e = Math.min(months.indexOf(prevMonth) + 1, months.length);
  const sliceStart = Math.max(e - 12, 0);
  const sliceEnd = e;

  const indicators = [
    { name: 'CPI', data: cpiData.yoy.slice(sliceStart, sliceEnd), color: '#ef4444', key: 'cpi' },
    { name: 'PPI', data: ppiData.yoy.slice(sliceStart, sliceEnd), color: '#2563eb', key: 'ppi' },
    { name: '出口', data: exportData.yoy.slice(sliceStart, sliceEnd), color: '#f59e0b', key: 'trade' },
    { name: '社零', data: retailData.yoy.slice(sliceStart, sliceEnd), color: '#8b5cf6', key: 'retail' },
    { name: '固投', data: faiData.accumYoy.slice(sliceStart, sliceEnd), color: '#22c55e', key: 'fai' },
    { name: '房地产', data: realestateData.salesAreaAccumYoy.slice(sliceStart, sliceEnd), color: '#06b6d4', key: 'realestate' },
  ];

  // 对每个指标，根据发布状态将未发布月份置 null
  const slicedMonths = months.slice(sliceStart, sliceEnd);
  const blankedIndicators = indicators.map(ind => ({
    ...ind,
    data: ind.data.map((v, i) => {
      const month = slicedMonths[i];
      if (!month) return v;
      return isPublished(month, ind.key) ? v : null;
    }),
  }));

  return (
    <div className="grid grid-cols-2 gap-4">
      {blankedIndicators.map(ind => (
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
              <td className={`${cellClass} text-left font-medium text-[#1e293b] sticky left-0 ${ri % 2 === 1 ? 'bg-[#fafbfc]' : 'bg-white'} z-10`}>
                <WindIdHover id={isYoy ? overviewWindId(row.label) : (overviewWindIdMom(row.label) || overviewWindId(row.label))}>{row.label}</WindIdHover>
              </td>
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
  const analysisMonth = '2026年6月';

  return (
    <div className="space-y-4">
      {/* 第一个模块：经济解读 - 立即渲染 */}
      <ChartCard title={`${analysisMonth} 宏观经济数据解读`}>
        <div className="text-sm text-[#334155] leading-relaxed space-y-2">
          <p>{analysisMonth}，宏观经济运行总体平稳。物价温和回升，CPI同比上涨1.0%（6月），PPI同比上涨4.1%（6月），制造业PMI为50.3%保持扩张区间。出口当月同比27.0%大幅回升，社零同比1.0%温和增长。6月CPI/PPI/PMI/贸易数据均已公布。</p>
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
