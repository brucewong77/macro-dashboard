import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months as allMonths } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';
import { WindIdHover } from '../components/WindIdHover';
import incomeRaw from '../data/incomeExcelData.json';

const incomeExcelData = incomeRaw as {
  months: string[]; // 季度月份: ['2010-03','2010-06','2010-09','2010-12',...]
  data: Record<string, (number | null)[]>;
};

/** 在季度数组中按日期范围切片，返回 [startIdx, endIdx) */
function sliceQuarterRange(startStr: string, endStr: string): [number, number] {
  const qm = incomeExcelData.months;
  let s = qm.findIndex(m => m >= startStr);
  let e = qm.findIndex(m => m > endStr);
  if (s === -1) s = 0;
  if (e === -1) e = qm.length;
  return [s, e];
}

export function IncomeModule() {
  const qm = incomeExcelData.months;
  const data = incomeExcelData.data;

  // ===== Chart1: 居民人均可支配收入累计同比（名义 vs 实际） =====
  const dr1 = useChartDateRange(2013, 12);
  const [s1, e1] = useMemo(() => sliceQuarterRange(dr1.startStr, dr1.endStr), [dr1]);
  const x1 = useMemo(() => qm.slice(s1, e1), [s1, e1]);

  const c1 = useMemo(() => {
    const nominal: (number | null)[] = [];
    const real: (number | null)[] = [];
    for (let i = s1; i < e1; i++) {
      nominal.push(data.national_nominal_yoy[i]);
      real.push(data.national_real_yoy[i]);
    }
    return { nominal, real };
  }, [s1, e1]);

  // ===== Chart2: 城镇/农村累计实际同比 =====
  const dr2 = useChartDateRange(2014, 3);
  const [s2, e2] = useMemo(() => sliceQuarterRange(dr2.startStr, dr2.endStr), [dr2]);
  const x2 = useMemo(() => qm.slice(s2, e2), [s2, e2]);

  const c2 = useMemo(() => {
    const urban: (number | null)[] = [];
    const rural: (number | null)[] = [];
    for (let i = s2; i < e2; i++) {
      urban.push(data.urban_real_yoy[i]);
      rural.push(data.rural_real_yoy[i]);
    }
    return { urban, rural };
  }, [s2, e2]);

  // ===== Chart3: 城镇与农村累计值百分比堆积柱状图 =====
  const dr3 = useChartDateRange(2010, 12);
  const [s3, e3] = useMemo(() => sliceQuarterRange(dr3.startStr, dr3.endStr), [dr3]);
  const x3 = useMemo(() => qm.slice(s3, e3), [s3, e3]);

  const c3 = useMemo(() => {
    const months: string[] = [];
    const urbanPct: number[] = [];
    const ruralPct: number[] = [];
    const totals: number[] = [];
    for (let i = s3; i < e3; i++) {
      const u = data.urban_accum_val[i];
      const r = data.rural_accum_val[i];
      if (u != null && r != null && u + r > 0) {
        const t = u + r;
        months.push(qm[i]);
        urbanPct.push(Number(((u / t) * 100).toFixed(1)));
        ruralPct.push(Number(((r / t) * 100).toFixed(1)));
        totals.push(Number(t.toFixed(0)));
      }
    }
    return { months, urbanPct, ruralPct, totals };
  }, [s3, e3]);

  // ===== Chart4: 分项累计同比折线图（2020至今） =====
  const dr4 = useChartDateRange(2020, 3);
  const [s4, e4] = useMemo(() => sliceQuarterRange(dr4.startStr, dr4.endStr), [dr4]);
  const x4 = useMemo(() => qm.slice(s4, e4), [s4, e4]);

  const subYoyItems = [
    { key: 'wage_yoy', name: '工资性收入', color: '#ef4444' },
    { key: 'operating_yoy', name: '经营净收入', color: '#3b82f6' },
    { key: 'transfer_yoy', name: '转移净收入', color: '#10b981' },
    { key: 'property_yoy', name: '财产净收入', color: '#f59e0b' },
  ];

  // ===== Chart5: 分项累计值百分比堆积柱状图（2014至今） =====
  const dr5 = useChartDateRange(2014, 3);
  const [s5, e5] = useMemo(() => sliceQuarterRange(dr5.startStr, dr5.endStr), [dr5]);
  const x5 = useMemo(() => qm.slice(s5, e5), [s5, e5]);

  const subAccumKeys = ['wage_accum', 'operating_accum', 'transfer_accum', 'property_accum'] as const;
  const subAccumNames = ['工资性收入', '经营净收入', '转移净收入', '财产净收入'];
  const subAccumColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];

  const c5 = useMemo(() => {
    const months: string[] = [];
    const pcts: Record<string, number[]> = {};
    subAccumKeys.forEach(k => { pcts[k] = []; });
    for (let i = s5; i < e5; i++) {
      const vals = subAccumKeys.map(k => data[k][i]);
      if (vals.some(v => v == null)) continue;
      const total = (vals[0] as number) + (vals[1] as number) + (vals[2] as number) + (vals[3] as number);
      if (total <= 0) continue;
      months.push(qm[i]);
      subAccumKeys.forEach((k, j) => {
        pcts[k].push(Number(((vals[j] as number) / total * 100).toFixed(1)));
      });
    }
    return { months, pcts };
  }, [s5, e5]);

  return (
    <div className="space-y-4">
      {/* ===== 图1：全国累计同比（名义 vs 实际） ===== */}
      <ChartCard title={<WindIdHover id="M5481764">居民人均可支配收入累计同比</WindIdHover>} subtitle={`季度数据 | ${DATA_SOURCES.income}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          legend: { data: ['名义同比', '实际同比'], top: 5, textStyle: { color: '#64748b', fontSize: 11 }, icon: 'circle', itemWidth: 8, itemHeight: 8 },
          grid: { top: 40, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: x1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: [
            { name: '名义同比', type: 'line', data: c1.nominal, connectNulls: true, smooth: true, lineStyle: { color: '#ef4444', width: 2 }, itemStyle: { color: '#ef4444' }, symbol: 'circle', symbolSize: 3 },
            { name: '实际同比', type: 'line', data: c1.real, connectNulls: true, smooth: true, lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' }, symbol: 'circle', symbolSize: 3 },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      {/* ===== 图2：城镇/农村累计实际同比 ===== */}
      <ChartCard title={<span>城镇<WindIdHover id="M0012990" />与农村<WindIdHover id="M5541280" />居民人均可支配收入累计实际同比</span>} subtitle={`季度数据 | ${DATA_SOURCES.income}`} dateRange={dr2}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          legend: { data: ['城镇', '农村'], top: 5, textStyle: { color: '#64748b', fontSize: 11 }, icon: 'circle', itemWidth: 8, itemHeight: 8 },
          grid: { top: 40, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: x2, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: [
            { name: '城镇', type: 'line', data: c2.urban, connectNulls: true, smooth: true, lineStyle: { color: '#ef4444', width: 2 }, itemStyle: { color: '#ef4444' }, symbol: 'circle', symbolSize: 3 },
            { name: '农村', type: 'line', data: c2.rural, connectNulls: true, smooth: true, lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' }, symbol: 'circle', symbolSize: 3 },
          ],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      {/* ===== 图3：城镇与农村累计值百分比堆积柱状图 ===== */}
      <ChartCard title="城镇与农村居民人均可支配收入累计值和占比" subtitle={`季度数据 | ${DATA_SOURCES.income}`} dateRange={dr3}>
        <ReactECharts option={{
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderColor: '#e2e8f0',
            textStyle: { color: '#1e293b' },
            formatter: (params: any) => {
              if (!Array.isArray(params)) return '';
              let html = `<div style="font-weight:600;margin-bottom:6px">${params[0].axisValue}</div>`;
              params.forEach((p: any) => {
                html += `<div style="display:flex;justify-content:space-between;gap:20px"><span>${p.marker} ${p.seriesName}</span><span style="font-weight:600">${p.value}%</span></div>`;
              });
              const idx = params[0].dataIndex;
              html += `<div style="border-top:1px solid #e2e8f0;margin-top:4px;padding-top:4px;color:#64748b">合计: ${c3.totals[idx]?.toLocaleString() ?? '--'} 元</div>`;
              return html;
            },
          },
          legend: { data: ['城镇', '农村'], bottom: 0, textStyle: { color: '#64748b', fontSize: 10 }, icon: 'roundRect', itemWidth: 12, itemHeight: 8 },
          grid: { top: 10, right: 20, bottom: 50, left: 55 },
          xAxis: { type: 'category', data: c3.months, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', max: 100, nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: [
            { name: '城镇', type: 'bar', stack: 'total', data: c3.urbanPct, barMaxWidth: 30, itemStyle: { color: '#ef4444' }, emphasis: { focus: 'series' },
              label: { show: true, position: 'inside', formatter: (p: any) => p.value > 25 ? `${p.value}%` : '', fontSize: 9, color: '#fff' },
            },
            { name: '农村', type: 'bar', stack: 'total', data: c3.ruralPct, barMaxWidth: 30, itemStyle: { color: '#3b82f6' }, emphasis: { focus: 'series' },
              label: { show: true, position: 'inside', formatter: (p: any) => p.value > 25 ? `${p.value}%` : '', fontSize: 9, color: '#e2e8f0' },
            },
          ],
          animationDuration: 500,
        }} style={{ height: 400 }} />
      </ChartCard>

      {/* ===== 图4：分项累计同比折线图（2020至今） ===== */}
      <ChartCard title={<WindIdHover id="M5481764">居民人均可支配收入分项累计同比</WindIdHover>} subtitle={`季度数据 | ${DATA_SOURCES.income} | 工资:M5481766 经营:M5481767 财产:M5481768 转移:M5481769`} dateRange={dr4}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          legend: { data: subYoyItems.map(s => s.name), bottom: 0, textStyle: { color: '#64748b', fontSize: 10 }, icon: 'circle', itemWidth: 8, itemHeight: 8 },
          grid: { top: 10, right: 20, bottom: 50, left: 50 },
          xAxis: { type: 'category', data: x4, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: subYoyItems.map(item => ({
            name: item.name, type: 'line',
            data: qm.slice(s4, e4).map((_, i) => data[item.key][s4 + i]),
            connectNulls: true, smooth: true,
            lineStyle: { color: item.color, width: 2 }, itemStyle: { color: item.color }, symbol: 'circle', symbolSize: 3,
          })),
          animationDuration: 500,
        }} style={{ height: 400 }} />
      </ChartCard>

      {/* ===== 图5：分项累计值百分比堆积柱状图 ===== */}
      <ChartCard title="居民人均可支配收入分项占比" subtitle={`季度数据 | ${DATA_SOURCES.income}`} dateRange={dr5}>
        <ReactECharts option={{
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderColor: '#e2e8f0',
            textStyle: { color: '#1e293b' },
            formatter: (params: any) => {
              if (!Array.isArray(params)) return '';
              let html = `<div style="font-weight:600;margin-bottom:6px">${params[0].axisValue}</div>`;
              params.forEach((p: any) => {
                html += `<div style="display:flex;justify-content:space-between;gap:20px"><span>${p.marker} ${p.seriesName}</span><span style="font-weight:600">${p.value}%</span></div>`;
              });
              return html;
            },
          },
          legend: { data: subAccumNames, bottom: 0, textStyle: { color: '#64748b', fontSize: 10 }, icon: 'roundRect', itemWidth: 12, itemHeight: 8 },
          grid: { top: 10, right: 20, bottom: 50, left: 55 },
          xAxis: { type: 'category', data: c5.months, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', max: 100, nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: subAccumKeys.map((k, i) => ({
            name: subAccumNames[i], type: 'bar', stack: 'total', barMaxWidth: 24,
            data: c5.pcts[k],
            itemStyle: { color: subAccumColors[i] },
            emphasis: { focus: 'series' },
            label: { show: true, position: 'inside',
              formatter: (p: any) => p.value > 8 ? `${p.value}%` : '',
              fontSize: 9, color: (i < 2 ? '#fff' : '#1e293b'),
            },
          })),
          animationDuration: 500,
        }} style={{ height: 400 }} />
      </ChartCard>

      <IndicatorExplanation
        title="居民收入指标说明"
        items={[
          { label: '指标定义', content: '居民可支配收入指居民可用于最终消费支出和储蓄的总和，即调查户可以用来自由支配的收入。名义同比为直接计算，实际同比为扣除价格因素后的增长率。' },
          { label: '分类', content: '收入来源分为工资性收入、经营净收入、财产净收入和转移净收入四大类。工资性收入是主要来源（占比约56%），转移净收入含养老金、社会救助等。' },
          { label: '数据来源', content: '国家统计局（www.stats.gov.cn），每季度公布一次，通常在季度次月中旬发布。' },
          { label: '指标意义', content: '收入增长是消费的基础。居民收入增速>经济增速表明居民分享增长成果。城乡收入比缩小体现共同富裕进展。' },
        ]}
      />
    </div>
  );
}

export default IncomeModule;
