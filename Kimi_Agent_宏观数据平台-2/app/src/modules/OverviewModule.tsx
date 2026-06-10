import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { months, cpiData, ppiData, pmiData, exportData, importData, retailData, industrialData, faiData, realestateData, socialFinancingData, getIndexRange } from '../data/economicData';

// 获取上月数据
function getLastMonthValue(arr: number[], monthsArr: string[]): { value: number | null; month: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const targetMonth = month === 0 ? `${year - 1}-12` : `${year}-${String(month).padStart(2, '0')}`;
  const idx = monthsArr.indexOf(targetMonth);
  if (idx >= 0 && arr[idx] !== undefined && arr[idx] !== null) {
    return { value: arr[idx], month: targetMonth };
  }
  for (let i = monthsArr.length - 1; i >= 0; i--) {
    if (arr[i] !== undefined && arr[i] !== null) {
      return { value: arr[i], month: monthsArr[i] };
    }
  }
  return { value: null, month: '' };
}

function getChange(val: number | null, arr: number[], _monthsArr: string[]): string {
  if (val === null) return '未发布';
  const idx = arr.indexOf(val);
  if (idx <= 0) return '—';
  const prev = arr[idx - 1];
  if (prev === undefined || prev === null) return '—';
  const diff = val - prev;
  const sign = diff >= 0 ? '↗' : '↘';
  return `${sign} ${Math.abs(diff).toFixed(1)}`;
}

function getYoy(arr: number[], monthsArr: string[]): { value: number | null; month: string; change: string } {
  const curr = getLastMonthValue(arr, monthsArr);
  if (curr.value === null) return { value: null, month: '', change: '未发布' };
  const idx = monthsArr.indexOf(curr.month);
  const prevYearIdx = idx - 12;
  if (prevYearIdx < 0) return { value: curr.value, month: curr.month, change: '同比 —' };
  const prevVal = arr[prevYearIdx];
  if (prevVal === undefined || prevVal === null) return { value: curr.value, month: curr.month, change: '同比 —' };
  const diff = curr.value - prevVal;
  const sign = diff >= 0 ? '↗' : '↘';
  return { value: curr.value, month: curr.month, change: `${sign} ${Math.abs(diff).toFixed(1)}` };
}

function getMom(arr: number[], monthsArr: string[]): { value: number | null; month: string; change: string } {
  const curr = getLastMonthValue(arr, monthsArr);
  if (curr.value === null) return { value: null, month: '', change: '未发布' };
  const change = getChange(curr.value, arr, monthsArr);
  return { value: curr.value, month: curr.month, change };
}

interface KpiCardProps {
  label: string;
  month: string;
  yoyValue: number | null;
  yoyChange: string;
  momValue: number | null;
  momChange: string;
}

function KpiCard({ label, month, yoyValue, yoyChange, momValue, momChange }: KpiCardProps) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 hover:border-[#cbd5e1] hover:shadow-md transition-all">
      <div className="text-sm text-[#64748b] mb-1">{label}</div>
      <div className="text-xs text-[#94a3b8] mb-2">{month || '数据未更新'}</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-[#94a3b8]">同比</div>
          <div className="text-lg font-bold text-[#1e293b] tabular-nums">{yoyValue !== null ? `${yoyValue}%` : '—'}</div>
          <div className={`text-xs ${yoyChange.includes('↗') ? 'text-[#ef4444]' : yoyChange.includes('↘') ? 'text-[#22c55e]' : 'text-[#94a3b8]'}`}>{yoyChange}</div>
        </div>
        <div>
          <div className="text-xs text-[#94a3b8]">环比</div>
          <div className="text-lg font-bold text-[#1e293b] tabular-nums">{momValue !== null ? `${momValue}%` : '—'}</div>
          <div className={`text-xs ${momChange.includes('↗') ? 'text-[#ef4444]' : momChange.includes('↘') ? 'text-[#22c55e]' : 'text-[#94a3b8]'}`}>{momChange}</div>
        </div>
      </div>
    </div>
  );
}

// 纯 SVG 迷你折线图 - 无需 echarts，首屏立即可渲染
function SvgMiniChart({ data, color, name }: { data: number[]; color: string; name: string }) {
  const width = 160;
  const height = 80;
  const padding = 8;
  const validData = data.filter(v => v !== null && v !== undefined);
  if (validData.length === 0) return null;
  
  const minVal = -40;
  const maxVal = 30;
  const range = maxVal - minVal;
  
  const points = validData.map((v, i) => {
    const x = padding + (i / (validData.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - minVal) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  
  const zeroY = height - padding - ((0 - minVal) / range) * (height - padding * 2);
  const lastVal = validData[validData.length - 1];
  const arrow = lastVal >= 0 ? '↗' : '↘';
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-bold text-[#475569] mb-1">{name}</div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* 零线 */}
        <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="2,2" />
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
    </div>
  );
}

// 概览图表区域 - 6个迷你 SVG 折线图
function OverviewCharts() {
  const [, e] = useMemo(() => getIndexRange(months, '2025-04', '2026-03'), []);
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

export function OverviewModule() {
  const kpiData = useMemo(() => {
    const cpiYoy = getYoy(cpiData.yoy, months);
    const cpiMom = getMom(cpiData.mom, months);
    const ppiYoy = getYoy(ppiData.yoy, months);
    const ppiMom = getMom(ppiData.mom, months);
    const pmi = getLastMonthValue(pmiData.manufacturing, months);
    const pmiMom = getMom(pmiData.manufacturing, months);
    const expYoy = getYoy(exportData.yoy, months);
    const expMom = getMom(exportData.yoy, months);
    const impYoy = getYoy(importData.yoy, months);
    const impMom = getMom(importData.yoy, months);
    const retailYoy = getYoy(retailData.yoy, months);
    const retailMom = getMom(retailData.yoy, months);
    const indYoy = getYoy(industrialData.yoy, months);
    const indMom = getMom(industrialData.yoy, months);
    const faiYoy = getYoy(faiData.accumYoy, months);
    const faiMom = getMom(faiData.accumYoy, months);
    const reYoy = getYoy(realestateData.salesAreaAccumYoy, months);
    const reMom = getMom(realestateData.salesAreaAccumYoy, months);
    const sfYoy = getYoy(socialFinancingData.yoy, months);
    const sfMom = getMom(socialFinancingData.yoy, months);

    return [
      { label: 'CPI', month: cpiYoy.month, yoyValue: cpiYoy.value, yoyChange: cpiYoy.change, momValue: cpiMom.value, momChange: cpiMom.change },
      { label: 'PPI', month: ppiYoy.month, yoyValue: ppiYoy.value, yoyChange: ppiYoy.change, momValue: ppiMom.value, momChange: ppiMom.change },
      { label: '制造业PMI', month: pmi.month || '', yoyValue: pmi.value, yoyChange: pmi.value !== null ? `${pmi.value}%` : '未发布', momValue: pmi.value, momChange: pmiMom.change },
      { label: '进口', month: impYoy.month, yoyValue: impYoy.value, yoyChange: impYoy.change, momValue: impMom.value, momChange: impMom.change },
      { label: '出口', month: expYoy.month, yoyValue: expYoy.value, yoyChange: expYoy.change, momValue: expMom.value, momChange: expMom.change },
      { label: '社零', month: retailYoy.month, yoyValue: retailYoy.value, yoyChange: retailYoy.change, momValue: retailMom.value, momChange: retailMom.change },
      { label: '工业增加值', month: indYoy.month, yoyValue: indYoy.value, yoyChange: indYoy.change, momValue: indMom.value, momChange: indMom.change },
      { label: '固投增速', month: faiYoy.month, yoyValue: faiYoy.value, yoyChange: faiYoy.change, momValue: faiMom.value, momChange: faiMom.change },
      { label: '房地产投资', month: reYoy.month, yoyValue: reYoy.value, yoyChange: reYoy.change, momValue: reMom.value, momChange: reMom.change },
      { label: '社融', month: sfYoy.month, yoyValue: sfYoy.value, yoyChange: sfYoy.change, momValue: sfMom.value, momChange: sfMom.change },
    ];
  }, []);

  const analysisMonth = '2026年3月';

  return (
    <div className="space-y-4">
      {/* 第一个模块：经济解读 - 立即渲染 */}
      <ChartCard title={`${analysisMonth} 宏观经济数据解读`}>
        <div className="text-sm text-[#334155] leading-relaxed space-y-2">
          <p>{analysisMonth}，宏观经济运行总体平稳。物价水平温和回升，CPI同比上涨0.8%，PPI同比降幅收窄至-0.1%。制造业PMI回升至50.2%的扩张区间，工业生产保持较快增长，消费市场稳步恢复。M2-M1剪刀差收窄，资金活化程度改善。固定资产投资累计同比增长4.2%，其中制造业投资增长8.8%，基础设施投资增长5.5%，房地产开发投资下降8.0%。社会融资规模增量3.2万亿元，比上年同期多增3800亿元。进出口总额同比增长，外贸保持韧性。</p>
        </div>
      </ChartCard>

      {/* 第二个模块：指标同比环比卡片 - 立即渲染 */}
      <ChartCard title="上月主要指标同比与环比情况">
        <div className="grid grid-cols-5 gap-3">
          {kpiData.map((kpi, i) => (
            <KpiCard key={i} {...kpi} />
          ))}
        </div>
      </ChartCard>

      {/* 第三个模块：近12个月指标趋势（纯 SVG，无需 echarts） */}
      <ChartCard title="近12个月主要指标同比增速趋势">
        <OverviewCharts />
      </ChartCard>
    </div>
  );
}

export default OverviewModule;
