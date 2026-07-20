import { useMemo, useState } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';
import { WindIdHover } from '../components/WindIdHover';
import depRaw from '../data/depositExcelData.json';

const depData = depRaw as {
  dates: string[];
  columns: Record<string, { name: string; data: Record<string, number> }>;
};
const g = (id: string) => depData.columns[id]?.data ?? {};

function recent12(): string[] {
  const all = Object.keys(g('M0009942')).sort();
  return all.slice(-12); // ascending, already rightmost=latest
}

function yearCumLines(id: string, unit: string) {
  const d = g(id);
  if (!d) return null;
  const years = [2026, 2025, 2024, 2023, 2022, 2021];
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#94a3b8'];
  const xAxisData = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
  const series = years.map((y, i) => {
    let cum = 0;
    const data: (number | null)[] = [];
    for (let m = 1; m <= 12; m++) {
      const v = d[`${y}-${String(m).padStart(2, '0')}`];
      if (v != null) { cum += v; data.push(cum); }
      else data.push(null);
    }
    return { name: `${y}年`, type: 'line' as const, data, connectNulls: false, smooth: true, lineStyle: { color: colors[i], width: 2 }, itemStyle: { color: colors[i] }, symbol: 'circle', symbolSize: 3 };
  });
  return {
    tooltip: { trigger: 'axis' as const },
    legend: { data: years.map(y => `${y}年`), bottom: 0, textStyle: { color: '#64748b', fontSize: 9 } },
    grid: { top: 10, right: 15, bottom: 40, left: 55 },
    xAxis: { type: 'category' as const, data: xAxisData, axisLabel: { color: '#64748b', fontSize: 9 } },
    yAxis: { type: 'value' as const, name: unit, nameTextStyle: { fontSize: 9 }, axisLabel: { fontSize: 9, formatter: (v: number) => v >= 10000 ? (v / 10000).toFixed(0) + '万' : v.toString() }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
    series,
  };
}

function leverageLines(id: string, label: string, color: string) {
  const d = g(id);
  if (!d) return null;
  const allDates = Object.keys(d).sort();
  const d2010 = allDates.filter(m => m >= '2010-01');
  return {
    tooltip: { trigger: 'axis' as const, formatter: (p: any) => `${p[0]?.axisValue}<br/>${label}: ${p[0]?.value}%` },
    grid: { top: 10, right: 20, bottom: 30, left: 50 },
    xAxis: { type: 'category' as const, data: d2010, axisLabel: { color: '#64748b', fontSize: 9, rotate: 30 } },
    yAxis: { type: 'value' as const, name: '%', nameTextStyle: { fontSize: 9 }, axisLabel: { fontSize: 9 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
    series: [{ type: 'line' as const, data: d2010.map(m => d[m] ?? null), connectNulls: true, smooth: true, name: label, lineStyle: { color, width: 2 }, itemStyle: { color }, symbol: 'circle', symbolSize: 3 }],
  };
}

function countryLeverageCharts(country: string) {
  const ids: Record<string, string> = country === '中国' ? {
    nonFin: 'M6404534', gov: 'M6404535', res: 'M6404533',
  } : country === '美国' ? {
    nonFin: 'G4902550', gov: 'G4902743', res: 'G4902638',
  } : {
    nonFin: 'G4902535', gov: 'G4902729', res: 'G4902611',
  };
  const colors = ['#ef4444', '#f59e0b', '#3b82f6'];
  const configs = [{ id: ids.nonFin, label: '非金融企业部门', color: colors[0] }, { id: ids.gov, label: '政府部门', color: colors[1] }, { id: ids.res, label: '居民部门', color: colors[2] }];

  const idLabels = country === '中国'
    ? ['非金融企业 M6404534', '政府 M6404535', '居民 M6404533']
    : country === '美国'
    ? ['非金融企业 G4902550', '政府 G4902743', '居民 G4902638']
    : ['非金融企业 G4902535', '政府 G4902729', '居民 G4902611'];

  return configs.map((cfg, i) => {
    const d = g(cfg.id);
    const allDates = Object.keys(d).sort().filter(m => m >= '2010-01');
    return {
      name: cfg.label,
      windId: idLabels[i],
      option: {
        tooltip: { trigger: 'axis' as const, formatter: (p: any) => `${p[0]?.axisValue}<br/>${cfg.label}: ${p[0]?.value}%` },
        grid: { top: 10, right: 10, bottom: 30, left: 45 },
        xAxis: { type: 'category' as const, data: allDates, axisLabel: { color: '#64748b', fontSize: 8, rotate: 30 } },
        yAxis: { type: 'value' as const, name: '%', nameTextStyle: { fontSize: 8 }, axisLabel: { fontSize: 8 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
        series: [{ type: 'line' as const, data: allDates.map(m => d[m] ?? null), connectNulls: true, smooth: true, lineStyle: { color: cfg.color, width: 2 }, itemStyle: { color: cfg.color }, symbol: 'circle', symbolSize: 2 }],
      },
    };
  });
}

export function DepositModule() {
  const rec12 = recent12();

  const months = useMemo(() => Object.keys(g('M0009942')).sort().filter(m => m >= '2020-01'), []);

  // Part 1: 分部门存款柱状图
  const householdDep = useMemo(() => rec12.map(m => g('M0009943')[m] ?? null), [rec12]);
  const corpDep = useMemo(() => rec12.map(m => g('M0057879')[m] ?? null), [rec12]);
  const fiscalDep = useMemo(() => rec12.map(m => g('M0009945')[m] ?? null), [rec12]);

  // Part 2: 总存款
  const totalDep = useMemo(() => rec12.map(m => g('M0009942')[m] ?? null), [rec12]);

  // Part 3: 累计值
  const cumTotal = useMemo(() => yearCumLines('M0048261', '亿元'), []);
  const cumHousehold = useMemo(() => yearCumLines('M0048262', '亿元'), []);
  const cumCorp = useMemo(() => yearCumLines('H4621398', '亿元'), []);
  const cumFiscal = useMemo(() => yearCumLines('M0048264', '亿元'), []);

  // Part 4-6: 杠杆率
  const cnCharts = useMemo(() => countryLeverageCharts('中国'), []);
  const usCharts = useMemo(() => countryLeverageCharts('美国'), []);
  const jpCharts = useMemo(() => countryLeverageCharts('日本'), []);

  const cnDates = useMemo(() => Object.keys(g('M6404532')).sort().filter(m => m >= '2010-01'), []);

  function leverageBlock(title: string, charts: ReturnType<typeof countryLeverageCharts>) {
    return (
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="px-4 py-2.5 border-b border-[#f1f5f9]"><h3 className="text-sm font-semibold text-[#1e293b]">{title}</h3></div>
        <div className="grid grid-cols-3 gap-2 p-3">
          {charts.map((c, i) => (
            <div key={i} className="bg-[#f8fafc] rounded-lg p-2">
              <p className="text-[10px] text-[#64748b] mb-1 font-medium">{c.name} <WindIdHover id={(c as any).windId}>{(c as any).windId}</WindIdHover></p>
              <ReactECharts option={c.option} style={{ height: 260 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Part 1 */}
      <ChartCard title={<WindIdHover id="M0009943">分部门新增人民币存款当月值（近12个月）</WindIdHover>} subtitle={`最新月靠右 | 数据来源：中国人民银行`} dateRange={useChartDateRange(2025, 5)}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          legend: { data: ['居民户(M0009943)', '非金融企业(M0057879)', '财政(M0009945)'], bottom: 0, textStyle: { color: '#64748b', fontSize: 10 } },
          grid: { top: 10, right: 20, bottom: 50, left: 55 },
          xAxis: { type: 'category', data: rec12, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 } },
          yAxis: { type: 'value', name: '亿元', nameTextStyle: { fontSize: 10 }, axisLabel: { fontSize: 10, formatter: (v: number) => v >= 10000 ? (v / 10000).toFixed(0) + '万' : v.toString() }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: [
            { name: '居民户', type: 'bar', data: householdDep, barGap: '0%', barCategoryGap: '30%', itemStyle: { color: '#ef4444' } },
            { name: '非金融企业', type: 'bar', data: corpDep, itemStyle: { color: '#3b82f6' } },
            { name: '财政', type: 'bar', data: fiscalDep, itemStyle: { color: '#f59e0b' } },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      {/* Part 2 */}
      <ChartCard title={<WindIdHover id="M0009942">新增人民币存款当月值（近12个月）</WindIdHover>} subtitle={`最新月靠右 | 数据来源：中国人民银行`} dateRange={useChartDateRange(2025, 5)}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 55 },
          xAxis: { type: 'category', data: rec12, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 } },
          yAxis: { type: 'value', name: '亿元', nameTextStyle: { fontSize: 10 }, axisLabel: { fontSize: 10, formatter: (v: number) => v >= 10000 ? (v / 10000).toFixed(0) + '万' : v.toString() }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: [{ type: 'bar', data: totalDep, itemStyle: { color: (p: any) => (p.value ?? 0) >= 0 ? '#06b6d4' : '#ef4444', borderRadius: [3, 3, 0, 0] }, barWidth: '50%' }],
          animationDuration: 500,
        }} style={{ height: 360 }} />
      </ChartCard>

      {/* Part 3: 累计值 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="px-4 py-2.5 border-b border-[#f1f5f9]"><h3 className="text-sm font-semibold text-[#1e293b]">新增人民币存款累计值情况（亿元）</h3></div>
        <div className="p-3 space-y-3">
          <div className="bg-[#f8fafc] rounded-lg p-3">
            <p className="text-xs text-[#64748b] mb-1 font-medium"><WindIdHover id="M0048261">人民币存款累计</WindIdHover></p>
            {cumTotal && <ReactECharts option={cumTotal} style={{ height: 280 }} />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f8fafc] rounded-lg p-3">
              <p className="text-xs text-[#64748b] mb-1 font-medium"><WindIdHover id="M0048262">居民户存款累计</WindIdHover></p>
              {cumHousehold && <ReactECharts option={cumHousehold} style={{ height: 260 }} />}
            </div>
            <div className="bg-[#f8fafc] rounded-lg p-3">
              <p className="text-xs text-[#64748b] mb-1 font-medium"><WindIdHover id="H4621398">非金融企业存款累计</WindIdHover></p>
              {cumCorp && <ReactECharts option={cumCorp} style={{ height: 260 }} />}
            </div>
          </div>
          <div className="bg-[#f8fafc] rounded-lg p-3">
            <p className="text-xs text-[#64748b] mb-1 font-medium"><WindIdHover id="M0048264">财政存款累计</WindIdHover></p>
            {cumFiscal && <ReactECharts option={cumFiscal} style={{ height: 260 }} />}
          </div>
        </div>
      </div>

      {/* Part 4: 中国 */}
      {leverageBlock('中国杠杆率（CNBS）', cnCharts)}

      {/* Part 5: 美国 */}
      {leverageBlock('美国杠杆率（BIS）', usCharts)}

      {/* Part 6: 日本 */}
      {leverageBlock('日本杠杆率（BIS）', jpCharts)}

      <IndicatorExplanation title="存款和杠杆指标说明" items={[
        { label: '新增人民币存款', content: '当月新增人民币存款反映银行体系资金来源的变化。居民存款反映储蓄意愿，企业存款反映经营现金流，财政存款反映财政收支节奏。' },
        { label: '杠杆率', content: '中国数据来自国家资产负债表研究中心(CNBS)，美国日本数据来自国际清算银行(BIS)。杠杆率=债务/GDP，反映各部门负债水平。' },
        { label: '数据来源', content: '存款数据来自中国人民银行（www.pbc.gov.cn），杠杆率来自CNBS和BIS。' },
      ]} />
    </div>
  );
}

export default DepositModule;
