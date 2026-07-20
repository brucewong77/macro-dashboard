import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { getPrevMonthStr, months } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import {
  elec全社会_累计同比, elec全社会_当月同比, elec全社会_用电量,
  elec一产_当月同比, elec二产_当月同比, elec三产_当月同比,
  elec一产_用电量, elec二产_用电量, elec三产_用电量,
} from '../data/electricityExcelData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';
import { WindIdHover } from '../components/WindIdHover';

/* ─── 助函数 ─── */
function round(v: number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return Math.round(v * 10) / 10;
}

export function ElectricityModule() {
  const cy = Number(getPrevMonthStr().slice(0, 4));
  const lm = Number(getPrevMonthStr().slice(5, 7));

  // 0. 当月同比折线图（1-12月, 2024/2025/2026）
  const momOption = useMemo(() => {
    const years = [cy, cy - 1, cy - 2];
    const colors = ['#ef4444', '#3b82f6', '#94a3b8'];
    return {
      tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
      legend: { data: years.map(y => `${y}年`), top: 5, textStyle: { color: '#64748b', fontSize: 11 } },
      grid: { top: 40, right: 30, bottom: 30, left: 50 },
      xAxis: { type: 'category', data: Array.from({ length: 12 }, (_, i) => `${i + 1}月`), axisLabel: { color: '#64748b', fontSize: 10 } },
      yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 } },
      series: years.map((y, yi) => ({
        name: `${y}年`, type: 'line' as const,
        data: Array.from({ length: 12 }, (_, i) => {
          if (i + 1 > lm && y === cy) return null;
          const ms = `${y}-${String(i + 1).padStart(2, '0')}`;
          return round(elec全社会_当月同比.values[ms]) ?? null;
        }),
        lineStyle: { color: colors[yi], width: yi === 0 ? 2.5 : yi === 1 ? 2 : 1.5, type: yi === 2 ? 'dashed' as const : 'solid' as const },
        itemStyle: { color: colors[yi] },
        symbol: 'circle', symbolSize: yi === 0 ? 5 : 4,
        label: yi === 0 ? { show: true, color: '#ef4444', fontSize: 9, fontWeight: 'bold', position: 'top' } : undefined,
      })),
      animationDuration: 500,
    };
  }, [cy, lm]);

  // 1. 累计增速折线图（1-12月, 2024/2025/2026）
  const cumOption = useMemo(() => {
    const years = [cy, cy - 1, cy - 2];
    const colors = ['#ef4444', '#3b82f6', '#94a3b8'];
    return {
      tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
      legend: { data: years.map(y => `${y}年`), top: 5, textStyle: { color: '#64748b', fontSize: 11 } },
      grid: { top: 40, right: 30, bottom: 30, left: 50 },
      xAxis: { type: 'category', data: Array.from({ length: 12 }, (_, i) => `${i + 1}月`), axisLabel: { color: '#64748b', fontSize: 10 } },
      yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 } },
      series: years.map((y, yi) => ({
        name: `${y}年`, type: 'line' as const,
        data: Array.from({ length: 12 }, (_, i) => {
          if (i + 1 > lm && y === cy) return null;
          const ms = `${y}-${String(i + 1).padStart(2, '0')}`;
          return round(elec全社会_累计同比.values[ms]) ?? null;
        }),
        lineStyle: { color: colors[yi], width: yi === 0 ? 2.5 : yi === 1 ? 2 : 1.5, type: yi === 2 ? 'dashed' as const : 'solid' as const },
        itemStyle: { color: colors[yi] },
        symbol: 'circle', symbolSize: yi === 0 ? 5 : 4,
        label: yi === 0 ? { show: true, color: '#ef4444', fontSize: 9, fontWeight: 'bold', position: 'top' } : undefined,
      })),
      animationDuration: 500,
    };
  }, [cy, lm]);

  // 2. 一二三产业堆积柱状图（近两年，可选时间段）
  const drStack = useChartDateRange(cy - 1, 1);
  const stackOption = useMemo(() => {
    const allMonths = months.filter(m => m >= drStack.startStr && m <= drStack.endStr);
    const filtered = allMonths.filter(m => elec一产_用电量.values[m] != null);
    const stackData1 = filtered.map(m => round(elec一产_用电量.values[m] ? elec一产_用电量.values[m]! / 10000 : null));
    const stackData2 = filtered.map(m => round(elec二产_用电量.values[m] ? elec二产_用电量.values[m]! / 10000 : null));
    const stackData3 = filtered.map(m => round(elec三产_用电量.values[m] ? elec三产_用电量.values[m]! / 10000 : null));
    // "其他" = 全社会用电量 - 一二三产差值
    const stackDataOther = filtered.map(m => {
      const total = elec全社会_用电量.values[m];
      const one = elec一产_用电量.values[m];
      const two = elec二产_用电量.values[m];
      const three = elec三产_用电量.values[m];
      if (total == null || one == null || two == null || three == null) return null;
      const diff = (total - one - two - three) / 10000;
      return diff > 0 ? round(diff) : null;
    });
    return {
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#1e293b' },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          const total = params.reduce((sum: number, p: any) => sum + (p.value ?? 0), 0);
          let html = `<div style="font-weight:bold;margin-bottom:4px">${params[0].axisValue}</div>`;
          params.forEach((p: any) => {
            const pct = total > 0 ? ((p.value ?? 0) / total * 100).toFixed(1) : '0.0';
            html += `<div style="display:flex;justify-content:space-between;gap:16px">
              <span>${p.marker} ${p.seriesName}</span>
              <span style="font-weight:bold">${p.value?.toFixed(1) ?? '-'} 亿千瓦时（${pct}%）</span>
            </div>`;
          });
          html += `<div style="border-top:1px solid #e2e8f0;margin-top:4px;padding-top:4px;font-weight:bold">合计: ${total.toFixed(1)} 亿千瓦时</div>`;
          return html;
        },
      },
      legend: { data: ['第一产业', '第二产业', '第三产业', '其他'], top: 5, textStyle: { color: '#64748b', fontSize: 11 } },
      grid: { top: 40, right: 30, bottom: 30, left: 60 },
      xAxis: { type: 'category', data: filtered, axisLabel: { color: '#64748b', fontSize: 9, rotate: 30 } },
      yAxis: { type: 'value', name: '亿千瓦时', nameTextStyle: { color: '#94a3b8', fontSize: 10 } },
      series: [
        { name: '第一产业', type: 'bar' as const, stack: 'total', data: stackData1, itemStyle: { color: '#22c55e', borderRadius: [0, 0, 0, 0] }, barWidth: '60%', label: { show: true, position: 'inside', fontSize: 8, color: '#fff', formatter: (p: any) => { const idx = p.dataIndex; const total = (stackData1[idx] ?? 0) + (stackData2[idx] ?? 0) + (stackData3[idx] ?? 0) + (stackDataOther[idx] ?? 0); return total > 0 && (stackData1[idx] ?? 0) / total > 0.05 ? ((stackData1[idx] ?? 0) / total * 100).toFixed(1) + '%' : ''; } } },
        { name: '第二产业', type: 'bar' as const, stack: 'total', data: stackData2, itemStyle: { color: '#3b82f6' }, label: { show: true, position: 'inside', fontSize: 9, color: '#fff', formatter: (p: any) => { const idx = p.dataIndex; const total = (stackData1[idx] ?? 0) + (stackData2[idx] ?? 0) + (stackData3[idx] ?? 0) + (stackDataOther[idx] ?? 0); return total > 0 && (stackData2[idx] ?? 0) / total > 0.05 ? ((stackData2[idx] ?? 0) / total * 100).toFixed(1) + '%' : ''; } } },
        { name: '第三产业', type: 'bar' as const, stack: 'total', data: stackData3, itemStyle: { color: '#f59e0b' }, label: { show: true, position: 'inside', fontSize: 8, color: '#fff', formatter: (p: any) => { const idx = p.dataIndex; const total = (stackData1[idx] ?? 0) + (stackData2[idx] ?? 0) + (stackData3[idx] ?? 0) + (stackDataOther[idx] ?? 0); return total > 0 && (stackData3[idx] ?? 0) / total > 0.05 ? ((stackData3[idx] ?? 0) / total * 100).toFixed(1) + '%' : ''; } } },
        { name: '其他', type: 'bar' as const, stack: 'total', data: stackDataOther, itemStyle: { color: '#94a3b8', borderRadius: [3, 3, 0, 0] } },
      ],
      animationDuration: 500,
    };
  }, [drStack.startStr, drStack.endStr, cy]);

  // 3. 分产业当月同比柱状图（近一年，可选时间段）
  const drYoy = useChartDateRange(cy - 1, 1);
  const yoyOption = useMemo(() => {
    const allMonths = months.filter(m => m >= drYoy.startStr && m <= drYoy.endStr);
    const filtered = allMonths.filter(m => elec一产_当月同比.values[m] != null);
    return {
      tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
      legend: { data: ['第一产业', '第二产业', '第三产业'], top: 5, textStyle: { color: '#64748b', fontSize: 11 } },
      grid: { top: 40, right: 30, bottom: 30, left: 50 },
      xAxis: { type: 'category', data: filtered, axisLabel: { color: '#64748b', fontSize: 9, rotate: 30 } },
      yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 } },
      series: [
        { name: '第一产业', type: 'bar' as const, data: filtered.map(m => round(elec一产_当月同比.values[m])), itemStyle: { color: '#22c55e', borderRadius: [3, 3, 0, 0] }, barWidth: '25%', barGap: '10%' },
        { name: '第二产业', type: 'bar' as const, data: filtered.map(m => round(elec二产_当月同比.values[m])), itemStyle: { color: '#3b82f6', borderRadius: [3, 3, 0, 0] }, barWidth: '25%' },
        { name: '第三产业', type: 'bar' as const, data: filtered.map(m => round(elec三产_当月同比.values[m])), itemStyle: { color: '#f59e0b', borderRadius: [3, 3, 0, 0] }, barWidth: '25%' },
      ],
      animationDuration: 500,
    };
  }, [drYoy.startStr, drYoy.endStr, cy]);

  return (
    <div className="space-y-4">
      {/* 0. 全社会用电量当月同比 */}
      <ChartCard title={<WindIdHover id="S5100122">全社会用电量当月同比（{cy} vs {cy - 1} vs {cy - 2}）</WindIdHover>}>
        <p className="text-[10px] text-[#94a3b8] mb-2">数据来源：Wind（来源：社会用电量.xlsx）</p>
        <ReactECharts option={momOption} style={{ height: 380 }} />
      </ChartCard>

      {/* 1. 全社会用电量累计增速 */}
      <ChartCard title={<WindIdHover id="S0048397">全社会用电量累计增速（{cy} vs {cy - 1} vs {cy - 2}）</WindIdHover>}>
        <p className="text-[10px] text-[#94a3b8] mb-2">数据来源：Wind（来源：社会用电量.xlsx）</p>
        <ReactECharts option={cumOption} style={{ height: 380 }} />
      </ChartCard>

      {/* 2. 分产业用电量堆积柱状图 */}
      <ChartCard title="全社会用电量（分产业）" subtitle={`${drStack.startStr} ~ ${drStack.endStr} | 第一产业:S5100023 第二产业:S5100024 第三产业:S5100025`} dateRange={drStack}>
        <p className="text-[10px] text-[#94a3b8] mb-2">数据来源：Wind（来源：社会用电量.xlsx）</p>
        <ReactECharts option={stackOption} style={{ height: 400 }} />
      </ChartCard>

      {/* 3. 分产业用电量同比增速柱状图 */}
      <ChartCard title="全社会用电量同比增速（分产业）" subtitle={`${drYoy.startStr} ~ ${drYoy.endStr} | 一产同比:S5100124 二产同比:S5100125 三产同比:S5100126`} dateRange={drYoy}>
        <p className="text-[10px] text-[#94a3b8] mb-2">数据来源：Wind（来源：社会用电量.xlsx）</p>
        <ReactECharts option={yoyOption} style={{ height: 400 }} />
      </ChartCard>

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
