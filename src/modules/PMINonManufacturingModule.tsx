import { useMemo, useState } from 'react';
import { ChartCard } from '../components/ChartCard';
import { months, getPrevMonthStr } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import {
  nonMfg商务活动, nonMfg服务业, nonMfg服务业新订单, nonMfg服务业从业人员, nonMfg服务业业务活动预期,
  nonMfg建筑业, nonMfg建筑业新订单, nonMfg建筑业从业人员, nonMfg建筑业业务活动预期,
  nonMfg新订单, nonMfg新出口订单, nonMfg业务活动预期,
  type PmiExcelItem,
} from '../data/nonMfgExcelData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';
import { WindIdHover } from '../components/WindIdHover';

/* ─── 取细分项某月值 ─── */
function getSubVal(key: string, month: string): number {
  const map: Record<string, PmiExcelItem> = {
    service_business: nonMfg服务业,
    service_new_orders: nonMfg服务业新订单,
    service_employment: nonMfg服务业从业人员,
    service_biz_outlook: nonMfg服务业业务活动预期,
    construction: nonMfg建筑业,
    construction_new_orders: nonMfg建筑业新订单,
    construction_employment: nonMfg建筑业从业人员,
    construction_biz_outlook: nonMfg建筑业业务活动预期,
    new_orders: nonMfg新订单,
    new_export_orders: nonMfg新出口订单,
    business_outlook: nonMfg业务活动预期,
  };
  return map[key]?.values[month] ?? 50;
}

/* ─── 分组配置 ─── */
const PMI_NONMFG_WIND_IDS: Record<string, string> = {
  '商务活动': 'M0048236',
  '新订单': 'M0048237',
  '从业人员': '-',
  '业务活动预期': 'M0048239',
  '新出口订单': 'M0048238',
};
/* 服务业/建筑业细分Wind ID */
const SERVICE_WIND_IDS: Record<string, string> = {
  '商务活动': 'M5207838',
  '新订单': 'M5207839',
  '从业人员': 'M5207843',
  '业务活动预期': 'M5207844',
};
const CONSTRUCTION_WIND_IDS: Record<string, string> = {
  '商务活动': 'M5207831',
  '新订单': 'M5207832',
  '从业人员': 'M5207836',
  '业务活动预期': 'M5207837',
};
const SUB_GROUPS = [
  {
    label: '服务业', color: '#2563eb',
    items: [
      { key: 'service_business', name: '商务活动' },
      { key: 'service_new_orders', name: '新订单' },
      { key: 'service_employment', name: '从业人员' },
      { key: 'service_biz_outlook', name: '业务活动预期' },
    ],
  },
  {
    label: '建筑业', color: '#7c3aed',
    items: [
      { key: 'construction', name: '商务活动' },
      { key: 'construction_new_orders', name: '新订单' },
      { key: 'construction_employment', name: '从业人员' },
      { key: 'construction_biz_outlook', name: '业务活动预期' },
    ],
  },
  {
    label: '综合指标', color: '#0891b2',
    items: [
      { key: 'new_orders', name: '新订单' },
      { key: 'new_export_orders', name: '新出口订单' },
      { key: 'business_outlook', name: '业务活动预期' },
    ],
  },
];

/* ─── 热力图色阶：以50为荣枯线 ─── */
function getHeatBgColor(value: number): string {
  if (value === 50) return '#d1d5db';
  if (value > 50) {
    const diff = value - 50;
    const intensity = Math.min(diff / 5, 1);
    if (intensity < 0.15) return '#fee2e2';
    if (intensity < 0.30) return '#fecaca';
    if (intensity < 0.45) return '#fca5a5';
    if (intensity < 0.60) return '#f87171';
    if (intensity < 0.80) return '#ef4444';
    return '#b91c1c';
  }
  const diff = 50 - value;
  const intensity = Math.min(diff / 5, 1);
  if (intensity < 0.15) return '#dcfce7';
  if (intensity < 0.30) return '#bbf7d0';
  if (intensity < 0.45) return '#86efac';
  if (intensity < 0.60) return '#4ade80';
  if (intensity < 0.80) return '#22c55e';
  return '#15803d';
}

function getHeatTextColor(value: number): string {
  if (value === 50) return '#374151';
  const diff = Math.abs(value - 50);
  return diff > 4 ? '#ffffff' : '#1f2937';
}

export function PMINonManufacturingModule() {
  const cy = Number(getPrevMonthStr().slice(0, 4));

  // 非制造业PMI走势图（横轴1-12月）
  const nonMfgOption = useMemo(() => {
    const latestMonth = Number(getPrevMonthStr().slice(5, 7));
    const cyData: (number | null)[] = [];
    const pyData: (number | null)[] = [];
    const p2yData: (number | null)[] = [];
    for (let m = 1; m <= 12; m++) {
      if (m <= latestMonth) {
        const ms = `${cy}-${String(m).padStart(2,'0')}`;
        cyData.push(nonMfg商务活动.values[ms] ?? null);
      } else {
        cyData.push(null);
      }
      const pms = `${cy-1}-${String(m).padStart(2,'0')}`;
      pyData.push(nonMfg商务活动.values[pms] ?? null);
      const p2ms = `${cy-2}-${String(m).padStart(2,'0')}`;
      p2yData.push(nonMfg商务活动.values[p2ms] ?? null);
    }
    const allV = [...cyData, ...pyData, ...p2yData].filter(v => v !== null) as number[];
    const minV = Math.min(...allV);
    const maxV = Math.max(...allV);
    return {
      tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
      legend: { data: [`${cy}年`, `${cy-1}年`, `${cy-2}年`], top: 5, textStyle: { color: '#64748b', fontSize: 11 } },
      grid: { top: 40, right: 30, bottom: 30, left: 50 },
      xAxis: { type: 'category', data: Array.from({length: 12}, (_, i) => `${i+1}月`), axisLabel: { color: '#64748b', fontSize: 10 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', min: Math.floor(minV-1), max: Math.ceil(maxV+1), name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
      series: [
        { name: `${cy}年`, type: 'line', data: cyData, lineStyle: { color: '#ef4444', width: 2.5 }, itemStyle: { color: '#ef4444' }, symbol: 'circle', symbolSize: 5, label: { show: true, color: '#ef4444', fontSize: 9, fontWeight: 'bold', position: 'top' } },
        { name: `${cy-1}年`, type: 'line', data: pyData, lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' }, symbol: 'circle', symbolSize: 4 },
        { name: `${cy-2}年`, type: 'line', data: p2yData, lineStyle: { color: '#94a3b8', width: 1.5, type: 'dashed' as const }, itemStyle: { color: '#94a3b8' }, symbol: 'circle', symbolSize: 3 },
      ],
      animationDuration: 500,
    };
  }, []);

  // 非制造业PMI细分项热力图（近12个月，最新月靠左）
  const latestMonth = getPrevMonthStr();
  const latestY = Number(latestMonth.slice(0, 4));
  const latestM = Number(latestMonth.slice(5, 7));
  const recent12: string[] = [];
  for (let i = 0; i < 12; i++) {
    let m = latestM - i;
    let y = latestY;
    while (m <= 0) { m += 12; y--; }
    recent12.push(`${y}-${String(m).padStart(2, '0')}`);
  }
  const recentReversed = recent12;
  const [sortBy, setSortBy] = useState<string | null>(null);

  // 构建分组行数据
  const groupedRows = useMemo(() => {
    const result: ({ type: 'group'; label: string; color: string } | { type: 'item'; name: string; key: string })[] = [];
    for (const g of SUB_GROUPS) {
      result.push({ type: 'group', label: g.label, color: g.color });
      for (const item of g.items) {
        result.push({ type: 'item', name: item.name, key: item.key });
      }
    }
    return result;
  }, []);

  function getRowVal(key: string): number[] {
    return recentReversed.map(m => getSubVal(key, m));
  }

  return (
    <div className="space-y-4">
      {/* 非制造业PMI走势图 */}
      <ChartCard title={<span><WindIdHover id="M0048236">非制造业PMI走势</WindIdHover>（{cy} vs {cy-1} vs {cy-2}）</span>}>
        <p className="text-[10px] text-[#94a3b8] mb-2">{DATA_SOURCES.pmi}</p>
        <ReactECharts option={nonMfgOption} style={{ height: 380 }} />
      </ChartCard>

      {/* 非制造业PMI细分项情况 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[#f1f5f9]">
          <div>
            <h3 className="text-sm font-semibold text-[#1e293b]">非制造业PMI细分项情况（近12个月，最新月靠左）</h3>
            <p className="text-[10px] text-[#94a3b8]">{DATA_SOURCES.pmi}</p>
          </div>
          <select className="border border-[#e2e8f0] rounded text-[10px] px-1 py-0.5 text-[#64748b]" value={sortBy || ''} onChange={e => setSortBy(e.target.value || null)}>
            <option value="">默认排序</option>
            {recentReversed.map(m => <option key={m} value={m}>按{m}排序</option>)}
          </select>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="border border-[#e2e8f0] px-2 py-1.5 text-left text-[#475569] font-semibold sticky left-0 bg-[#f8fafc]">细分项</th>
                  {recentReversed.map(m => (
                    <th key={m} className="border border-[#e2e8f0] px-1.5 py-1.5 text-center text-[#475569] font-semibold min-w-[52px]">{m.slice(2)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedRows.map((entry) => {
                  if (entry.type === 'group') {
                    return (
                      <tr key={`g-${entry.label}`} className="bg-[#f1f5f9]">
                        <td
                          className="sticky left-0 z-10 bg-[#f1f5f9] px-3 py-1.5 text-xs font-bold tracking-wide"
                          style={{ color: entry.color }}
                          colSpan={1 + recentReversed.length}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: entry.color }} />
                            {entry.label}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                  const vals = getRowVal(entry.key);
                  return (
                    <tr key={entry.key} className="group transition-colors hover:bg-blue-50/40">
                      <td className="sticky left-0 z-10 bg-white border-r-2 border-[#cbd5e1] px-3 py-1.5 text-xs font-semibold text-[#334155] group-hover:bg-blue-50/40 transition-colors">
                        {entry.type === 'item' ? (
                          <WindIdHover id={
                            entry.key.startsWith('service') ? (SERVICE_WIND_IDS[entry.name] ?? '') :
                            entry.key.startsWith('construction') ? (CONSTRUCTION_WIND_IDS[entry.name] ?? '') :
                            (PMI_NONMFG_WIND_IDS[entry.name] ?? '')
                          }>{entry.name}</WindIdHover>
                        ) : entry.name}
                      </td>
                      {vals.map((v, ci) => (
                        <td key={ci}
                          className="border-r border-[#e2e8f0] px-2 py-1.5 text-xs text-center tabular-nums font-mono"
                          style={{
                            backgroundColor: getHeatBgColor(v),
                            color: getHeatTextColor(v),
                          }}
                        >
                          {v.toFixed(1)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 指标说明 */}
      <IndicatorExplanation
        title="非制造业PMI指标说明"
        items={[
          { label: '指标定义', content: '非制造业PMI反映服务业和建筑业等非制造业领域的经济活动状况，包括商务活动、新订单、从业人员等分项指数。50为荣枯线。' },
          { label: '数据来源', content: '国家统计局（www.stats.gov.cn）与中国物流与采购联合会，每月最后一天公布。' },
          { label: '指标意义', content: '非制造业PMI综合反映服务业和建筑业景气度，与制造业PMI结合可全面把握经济走势。' },
        ]}
      />
    </div>
  );
}

export default PMINonManufacturingModule;
