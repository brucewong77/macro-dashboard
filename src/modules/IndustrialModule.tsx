import { useMemo, useState } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { getPrevMonthStr } from '../data/economicData';
import {
  ind规模以上工业_mom, ind制造业_mom, ind采矿业_mom, ind电力燃气水_mom,
  ind高技术产业_mom, ind装备制造业_mom, ind计算机通信电子_mom, ind汽车制造业_mom,
  ind电气机械_mom, ind化学原料制品_mom, ind黑色金属冶炼_mom, ind有色金属冶炼_mom,
  ind非金属矿物_mom, ind通用设备_mom, ind专用设备_mom, ind医药制造业_mom, ind食品制造业_mom, ind纺织业_mom,
  ind规模以上工业_cum, ind制造业_cum, ind采矿业_cum, ind电力燃气水_cum,
  ind高技术产业_cum, ind装备制造业_cum, ind计算机通信电子_cum, ind汽车制造业_cum,
  ind电气机械_cum, ind化学原料制品_cum, ind黑色金属冶炼_cum, ind有色金属冶炼_cum,
  ind非金属矿物_cum, ind通用设备_cum, ind专用设备_cum, ind医药制造业_cum, ind食品制造业_cum, ind纺织业_cum,
  prod工业机器人_mom, prod集成电路_mom, prod新能源汽车_mom, prod智能手机_mom, prod光伏电池_mom,
  prod粗钢_mom, prod水泥_mom, prod挖掘机_mom, prod汽车_mom, prod平板玻璃_mom,
  prod金属切削机床_mom,
  prod工业机器人_cum, prod集成电路_cum, prod新能源汽车_cum, prod智能手机_cum, prod光伏电池_cum,
  prod粗钢_cum, prod水泥_cum, prod挖掘机_cum, prod汽车_cum, prod平板玻璃_cum,
  prod金属切削机床_cum,
} from '../data/industrialExcelData';
import type { IndExcelItem } from '../data/industrialExcelData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';
import { WindIdHover } from '../components/WindIdHover';

function getHeatBgColor(value: number): string {
  if (value === 0) return '#d1d5db';
  if (value > 0) {
    const intensity = Math.min(Math.abs(value) / 10, 1);
    if (intensity < 0.15) return '#fee2e2';
    if (intensity < 0.30) return '#fecaca';
    if (intensity < 0.45) return '#fca5a5';
    if (intensity < 0.60) return '#f87171';
    if (intensity < 0.80) return '#ef4444';
    return '#b91c1c';
  }
  const intensity = Math.min(Math.abs(value) / 10, 1);
  if (intensity < 0.15) return '#dcfce7';
  if (intensity < 0.30) return '#bbf7d0';
  if (intensity < 0.45) return '#86efac';
  if (intensity < 0.60) return '#4ade80';
  if (intensity < 0.80) return '#22c55e';
  return '#15803d';
}

function getHeatTextColor(value: number): string {
  return Math.abs(value) > 8 ? '#ffffff' : '#1f2937';
}

function formatVal(v: number | null | undefined): string {
  if (v === null || v === undefined) return '-';
  return (v >= 0 ? '+' : '') + v.toFixed(1);
}

/* ─── 月份工具 ─── */
function recentMonths(n: number): string[] {
  const lm = getPrevMonthStr();
  const y = Number(lm.slice(0, 4));
  const m = Number(lm.slice(5, 7));
  const months: string[] = [];
  for (let i = 0; i < n; i++) {
    let mm = m - i, yy = y;
    while (mm <= 0) { mm += 12; yy--; }
    months.push(`${yy}-${String(mm).padStart(2, '0')}`);
  }
  return months;
}

/* ─── 行业配置 ─── */
const INDUSTRY_ROWS = [
  { name: '规模以上工业', mom: ind规模以上工业_mom, cum: ind规模以上工业_cum },
  { name: '制造业', mom: ind制造业_mom, cum: ind制造业_cum },
  { name: '采矿业', mom: ind采矿业_mom, cum: ind采矿业_cum },
  { name: '电力燃气水', mom: ind电力燃气水_mom, cum: ind电力燃气水_cum },
  { name: '高技术产业', mom: ind高技术产业_mom, cum: ind高技术产业_cum },
  { name: '装备制造业', mom: ind装备制造业_mom, cum: ind装备制造业_cum },
  { name: '计算机通信电子', mom: ind计算机通信电子_mom, cum: ind计算机通信电子_cum },
  { name: '汽车制造业', mom: ind汽车制造业_mom, cum: ind汽车制造业_cum },
  { name: '电气机械', mom: ind电气机械_mom, cum: ind电气机械_cum },
  { name: '化学原料制品', mom: ind化学原料制品_mom, cum: ind化学原料制品_cum },
  { name: '黑色金属冶炼', mom: ind黑色金属冶炼_mom, cum: ind黑色金属冶炼_cum },
  { name: '有色金属冶炼', mom: ind有色金属冶炼_mom, cum: ind有色金属冶炼_cum },
  { name: '非金属矿物', mom: ind非金属矿物_mom, cum: ind非金属矿物_cum },
  { name: '通用设备', mom: ind通用设备_mom, cum: ind通用设备_cum },
  { name: '专用设备', mom: ind专用设备_mom, cum: ind专用设备_cum },
  { name: '医药制造业', mom: ind医药制造业_mom, cum: ind医药制造业_cum },
  { name: '食品制造业', mom: ind食品制造业_mom, cum: ind食品制造业_cum },
  { name: '纺织业', mom: ind纺织业_mom, cum: ind纺织业_cum },
];

/* ─── 产品产量分组 ─── */
const PRODUCT_GROUPS = [
  {
    label: '新动能', color: '#ef4444',
    items: [
      { name: '工业机器人', mom: prod工业机器人_mom, cum: prod工业机器人_cum },
      { name: '集成电路', mom: prod集成电路_mom, cum: prod集成电路_cum },
      { name: '新能源汽车', mom: prod新能源汽车_mom, cum: prod新能源汽车_cum },
      { name: '智能手机', mom: prod智能手机_mom, cum: prod智能手机_cum },
      { name: '光伏电池', mom: prod光伏电池_mom, cum: prod光伏电池_cum },
    ],
  },
  {
    label: '旧动能', color: '#64748b',
    items: [
      { name: '粗钢', mom: prod粗钢_mom, cum: prod粗钢_cum },
      { name: '水泥', mom: prod水泥_mom, cum: prod水泥_cum },
      { name: '挖掘机', mom: prod挖掘机_mom, cum: prod挖掘机_cum },
      { name: '汽车', mom: prod汽车_mom, cum: prod汽车_cum },
      { name: '平板玻璃', mom: prod平板玻璃_mom, cum: prod平板玻璃_cum },
    ],
  },
  {
    label: '制造业基础', color: '#2563eb',
    items: [
      { name: '金属切削机床', mom: prod金属切削机床_mom, cum: prod金属切削机床_cum },
    ],
  },
];

/* ─── Wind 指标 ID ─── */
function industryWindId(name: string): string {
  const map: Record<string, string> = {
    '规模以上工业': 'M9003295',
    '制造业': 'M0096212',
    '采矿业': 'M0096211',
    '电力燃气水': 'M0096213',
    '高技术产业': 'M0330955',
    '装备制造业': 'M6512871',
    '计算机通信电子': 'M0000084',
    '汽车制造业': 'M0068071',
    '电气机械': 'M0000082',
    '化学原料制品': 'M0000058',
    '黑色金属冶炼': 'M0000070',
    '有色金属冶炼': 'M0000072',
    '非金属矿物': 'M0000068',
    '通用设备': 'M0000076',
    '专用设备': 'M0000078',
    '医药制造业': 'M0000060',
    '食品制造业': 'M0000034',
    '纺织业': 'M0000040',
  };
  return map[name] ?? '';
}

function productWindId(name: string): string {
  const map: Record<string, string> = {
    '工业机器人': 'S0243302',
    '集成电路': 'S0028183',
    '新能源汽车': 'S0243304',
    '智能手机': 'S0243306',
    '光伏电池': 'M6422141',
    '粗钢': 'S0027375',
    '水泥': 'S0027703',
    '挖掘机': 'S0073123',
    '汽车': 'S0027908',
    '平板玻璃': 'S0027711',
    '金属切削机床': 'S0027799',
  };
  return map[name] ?? '';
}

export function IndustrialModule() {
  const rec12 = recentMonths(12);
  const latestMonth = rec12[0];

  // 排序
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // 行业表格数据
  const tableRows = useMemo(() => {
    return INDUSTRY_ROWS.map((ind) => ({
      name: ind.name,
      values: rec12.map((m) => ind.mom.values[m] ?? null),
    }));
  }, [rec12]);

  const sortedTableRows = useMemo(() => {
    // 规模以上工业始终在第一行
    const overall = tableRows.find(r => r.name === '规模以上工业');
    const others = tableRows.filter(r => r.name !== '规模以上工业');
    if (!sortBy) return overall ? [overall, ...others] : tableRows;
    const idx = rec12.indexOf(sortBy);
    if (idx < 0) return overall ? [overall, ...others] : tableRows;
    const sortedOthers = [...others].sort((a, b) => {
      const va = a.values[idx] ?? -9999;
      const vb = b.values[idx] ?? -9999;
      return sortDir === 'desc' ? vb - va : va - vb;
    });
    return overall ? [overall, ...sortedOthers] : sortedOthers;
  }, [tableRows, sortBy, sortDir]);

  // 1. 累计增速折线图（默认2020年以来，可调时间段，跳过null月份）
  const drCum = useChartDateRange(2020, 1);
  const cumChartOption = useMemo(() => {
    const allMonths = ind规模以上工业_cum.months
      .filter((m) => m >= drCum.startStr && m <= drCum.endStr && ind规模以上工业_cum.values[m] != null)
      .reverse(); // 最早在左
    const data = allMonths.map((m) => ind规模以上工业_cum.values[m]);
    return {
      tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
      grid: { top: 10, right: 30, bottom: 30, left: 50 },
      xAxis: { type: 'category', data: allMonths, axisLabel: { color: '#64748b', fontSize: 9, rotate: 30 } },
      yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 } },
      series: [{
        type: 'line', data, smooth: true,
        lineStyle: { color: '#3b82f6', width: 2.5 }, itemStyle: { color: '#3b82f6' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59,130,246,0.15)' }, { offset: 1, color: 'rgba(59,130,246,0)' }] } },
        symbol: 'circle', symbolSize: 3,
      }],
      animationDuration: 500,
    };
  }, [drCum.startStr, drCum.endStr]);

  // 2. 当月同比柱状图（近12个月）
  const momChartOption = useMemo(() => {
    const months = rec12.slice().reverse(); // 最早在左
    const data = months.map((m) => ind规模以上工业_mom.values[m] ?? null);
    return {
      tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
      grid: { top: 10, right: 30, bottom: 30, left: 50 },
      xAxis: { type: 'category', data: months, axisLabel: { color: '#64748b', fontSize: 9, rotate: 30 } },
      yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 } },
      series: [{
        type: 'bar', data, barWidth: '50%',
        itemStyle: { color: (p: any) => (p.value ?? 0) >= 0 ? '#ef4444' : '#22c55e', borderRadius: [3, 3, 0, 0] },
      }],
      animationDuration: 500,
    };
  }, [rec12]);

  // 分行业累计增速柱状图
  const cumBarOption = useMemo(() => {
    const data = INDUSTRY_ROWS.map((ind) => ind.cum.values[latestMonth] ?? null);
    return {
      tooltip: { trigger: 'axis' as const },
      grid: { top: 10, right: 30, bottom: 80, left: 50 },
      xAxis: { type: 'category', data: INDUSTRY_ROWS.map((i) => i.name), axisLabel: { color: '#64748b', fontSize: 9, rotate: 45 } },
      yAxis: { type: 'value', name: '%' },
      series: [{
        type: 'bar', data: data.map((v) => ({
          value: v,
          itemStyle: { color: v !== null && v >= 0 ? '#ef4444' : '#22c55e', borderRadius: [3, 3, 0, 0] },
        })), barWidth: '60%',
        label: { show: true, position: 'top', fontSize: 9, color: '#475569' },
      }],
      animationDuration: 500,
    };
  }, [latestMonth]);

  return (
    <div className="space-y-4">
      {/* 1. 工业增加值累计增速（折线图） */}
      <ChartCard title={<WindIdHover id="M9003295">工业增加值累计增速</WindIdHover>} subtitle={`${drCum.startStr} ~ ${drCum.endStr}`} dateRange={drCum}>
        <p className="text-[10px] text-[#94a3b8] mb-2">数据来源：Wind（来源：工业增加值.xlsx）</p>
        <ReactECharts option={cumChartOption} style={{ height: 400 }} />
      </ChartCard>

      {/* 2. 工业增加值当月同比增速（柱状图，近12个月） */}
      <ChartCard title={<WindIdHover id="M9003295">工业增加值当月同比增速（近12个月）</WindIdHover>}>
        <p className="text-[10px] text-[#94a3b8] mb-2">数据来源：Wind（来源：工业增加值.xlsx）</p>
        <ReactECharts option={momChartOption} style={{ height: 380 }} />
      </ChartCard>

      {/* 2. 分行业工业增加值当月同比表格（支持按月份排序） */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#f1f5f9] flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[#1e293b]">分行业工业增加值当月同比增速（近12个月，最新月靠左）</h3>
            <p className="text-[10px] text-[#94a3b8]">数据来源：Wind（来源：工业增加值.xlsx）</p>
          </div>
          <select className="border border-[#e2e8f0] rounded text-[10px] px-1 py-0.5 text-[#64748b]" value={sortBy || ''}
            onChange={e => {
              const v = e.target.value || null;
              if (v === sortBy) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
              else { setSortBy(v); setSortDir('desc'); }
            }}>
            <option value="">默认排序</option>
            {rec12.map(m => <option key={m} value={m}>按{m}{sortBy === m ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ''}排序</option>)}
          </select>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">行业</th>
                  {rec12.map((m) => (
                    <th key={m} className={`border border-[#e2e8f0] px-1.5 py-1.5 text-center font-semibold min-w-[52px] cursor-pointer hover:bg-[#e2e8f0] select-none transition-colors ${sortBy === m ? 'text-[#2563eb] bg-blue-50' : 'text-[#475569]'}`}
                      onClick={() => {
                        if (sortBy === m) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                        else { setSortBy(m); setSortDir('desc'); }
                      }}>
                      <span className="inline-flex items-center gap-0.5">
                        {m.slice(2)}
                        <span className="text-[8px]">{sortBy === m ? (sortDir === 'desc' ? '▼' : '▲') : '⇅'}</span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedTableRows.map((row, ri) => (
                  <tr key={row.name} className="group transition-colors hover:bg-blue-50/40">
                    <td className="sticky left-0 z-10 bg-white border-r-2 border-[#cbd5e1] px-2 py-1.5 text-[#334155] font-medium group-hover:bg-blue-50/40 transition-colors">
                      {industryWindId(row.name) ? (
                        <WindIdHover id={industryWindId(row.name)}>{row.name}</WindIdHover>
                      ) : row.name}
                    </td>
                    {row.values.map((v, ci) => {
                      if (v === null) return <td key={ci} className="border border-[#e2e8f0] px-1 py-1 text-center text-[#94a3b8] text-[10px]">-</td>;
                      return (
                        <td key={ci} className="border border-[#e2e8f0] px-1 py-1 text-center tabular-nums font-mono"
                          style={{ backgroundColor: getHeatBgColor(v), color: getHeatTextColor(v) }}>
                          {formatVal(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. 分行业截止最新月累计增速柱状图 */}
      <ChartCard title={`分行业工业增加值累计增速（截至${latestMonth}）`}>
        <p className="text-[10px] text-[#94a3b8] mb-2">数据来源：Wind（来源：工业增加值.xlsx）</p>
        <ReactECharts option={cumBarOption} style={{ height: 420 }} />
      </ChartCard>

      {/* 4. 新旧动能产品产量增速表格 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="px-4 py-2.5 border-b border-[#f1f5f9]">
          <h3 className="text-sm font-semibold text-[#1e293b]">新旧动能产品产量增速（近12个月，最新月靠左）</h3>
          <p className="text-[10px] text-[#94a3b8]">数据来源：Wind（来源：工业增加值.xlsx）</p>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">产品</th>
                  <th className="border border-[#e2e8f0] px-1.5 py-1.5 text-center text-[#475569] font-semibold min-w-[60px]">累计增速</th>
                  {rec12.map((m) => (
                    <th key={m} className="border border-[#e2e8f0] px-1.5 py-1.5 text-center text-[#475569] font-semibold min-w-[52px]">{m.slice(2)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PRODUCT_GROUPS.flatMap((g) => [
                  <tr key={`g-${g.label}`} className="bg-[#f1f5f9]">
                    <td className="sticky left-0 z-10 bg-[#f1f5f9] px-3 py-1.5 text-xs font-bold tracking-wide" style={{ color: g.color }} colSpan={2 + rec12.length}>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: g.color }} />
                        {g.label}
                      </span>
                    </td>
                  </tr>,
                  ...g.items.map((item) => {
                    const cumVal = item.cum.values[latestMonth];
                    const momVals = rec12.map((m) => item.mom.values[m] ?? null);
                    return (
                      <tr key={item.name} className="hover:bg-blue-50/40">
                        <td className="sticky left-0 z-10 bg-white border-r-2 border-[#cbd5e1] px-2 py-1.5 text-[#334155] font-medium hover:bg-blue-50/40">
                          {productWindId(item.name) ? (
                            <WindIdHover id={productWindId(item.name)}>{item.name}</WindIdHover>
                          ) : item.name}
                        </td>
                        <td className="border border-[#e2e8f0] px-1 py-1.5 text-center tabular-nums font-mono font-semibold bg-blue-50/30">
                          {formatVal(cumVal)}
                        </td>
                        {momVals.map((v, ci) => {
                          if (v === null) return <td key={ci} className="border border-[#e2e8f0] px-1 py-1 text-center text-[#94a3b8] text-[10px]">-</td>;
                          return (
                            <td key={ci} className="border border-[#e2e8f0] px-1 py-1 text-center tabular-nums font-mono"
                              style={{ backgroundColor: getHeatBgColor(v), color: getHeatTextColor(v) }}>
                              {formatVal(v)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  }),
                ])}
              </tbody>
            </table>
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
