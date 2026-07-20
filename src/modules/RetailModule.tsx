import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { getIndexRange, blankUnpublished, months } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';
import { WindIdHover } from '../components/WindIdHover';
import retailRaw from '../data/retailExcelData.json';

// 从 JSON 中读取的零售数据
const retailExcelData = retailRaw as {
  months: string[];
  data: Record<string, (number | null)[]>;
};

// 工具函数：将数据切片并处理未发布月份
function sliceData(
  dataArr: (number | null)[],
  monthsArr: string[],
  startIdx: number,
  endIdx: number,
  indicatorKey: string
): (number | null)[] {
  const sliced = dataArr.slice(startIdx, endIdx);
  const slicedMonths = monthsArr.slice(startIdx, endIdx);
  return blankUnpublished(slicedMonths, sliced as number[], indicatorKey);
}

// 颜色方案
const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];
const COLORS_SERIES = [
  { name: '社会消费品零售总额', color: '#f59e0b' },
  { name: '限额以上单位', color: '#3b82f6' },
  { name: '商品零售', color: '#10b981' },
  { name: '网上商品零售额', color: '#8b5cf6' },
  { name: '除汽车外零售额', color: '#ec4899' },
  { name: '餐饮收入', color: '#06b6d4' },
];

/* ─── Wind 指标 ID ─── */

/* ─── 热力图色阶 ─── */
const HEAT_COLORS = {
  getBg: (v: number) => {
    if (v === 0) return '#e2e8f0';
    if (v > 0) {
      const t = Math.min(v / 15, 1);
      if (t < 0.1) return '#fef2f2'; if (t < 0.2) return '#fee2e2'; if (t < 0.35) return '#fecaca';
      if (t < 0.5) return '#fca5a5'; if (t < 0.7) return '#f87171';
      if (t < 0.85) return '#ef4444'; return '#b91c1c';
    }
    const t = Math.min(Math.abs(v) / 15, 1);
    if (t < 0.1) return '#f0fdf4'; if (t < 0.2) return '#dcfce7'; if (t < 0.35) return '#bbf7d0';
    if (t < 0.5) return '#86efac'; if (t < 0.7) return '#4ade80';
    if (t < 0.85) return '#22c55e'; return '#15803d';
  },
  getText: (v: number) => Math.abs(v) > 8 ? '#fff' : '#1f2937',
};
function retailWindId(name: string): string {
  const map: Record<string, string> = {
    '粮油、食品类': 'M0073698',
    '服装鞋帽针纺织品类': 'M0001456',
    '化妆品类': 'M0001464',
    '金银珠宝类': 'M0001465',
    '日用品类': 'M0001460',
    '体育、娱乐用品类': 'M0001459',
    '中西药品类': 'M0073705',
    '文化办公用品类': 'M0001458',
    '家具类': 'M0001462',
    '通讯器材类': 'M0001466',
    '石油及制品类': 'M0001468',
    '家用电器和音像器材类': 'M0001461',
    '建筑及装潢材料类': 'M0001463',
    '烟酒类': 'M0073702',
    '饮料类': 'M0073701',
    '汽车类': 'M0001467',
  };
  return map[name] ?? '';
}

/** 累计同比 Wind ID */
function retailCumWindId(name: string): string {
  const map: Record<string, string> = {
    '服装鞋帽针纺织品类': 'M0001472',
    '化妆品类': 'M0001480',
    '家具类': 'M0001478',
    '家用电器和音像器材类': 'M0001477',
    '建筑及装潢材料类': 'M0001479',
    '金银珠宝类': 'M0001481',
    '粮油、食品类': 'M0073707',
    '汽车类': 'M0001483',
    '日用品类': 'M0001476',
    '石油及制品类': 'M0001484',
    '体育、娱乐用品类': 'M0001475',
    '通讯器材类': 'M0001482',
    '文化办公用品类': 'M0001474',
    '烟酒类': 'M0073711',
    '饮料类': 'M0073710',
    '中西药品类': 'M0073714',
  };
  return map[name] ?? '';
}

export function RetailModule() {
  // ============ 第一部分：社零总额同比增速（默认 2021-01 至今） ============
  const dr1 = useChartDateRange(2021, 1);
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1]);
  const fm1 = useMemo(() => months.slice(s1, e1), [s1, e1]);
  const yoyData1 = useMemo(
    () => sliceData(retailExcelData.data.retail_total_yoy, months, s1, e1, 'retail'),
    [s1, e1]
  );

  // ============ 第二部分：社零总额累计同比（默认 2021-01 至今） ============
  const dr2 = useChartDateRange(2021, 1);
  const [s2, e2] = useMemo(() => getIndexRange(months, dr2.startStr, dr2.endStr), [dr2]);
  const fm2 = useMemo(() => months.slice(s2, e2), [s2, e2]);
  const accumYoyData2 = useMemo(
    () => sliceData(retailExcelData.data.retail_total_accum_yoy, months, s2, e2, 'retail'),
    [s2, e2]
  );

  // ============ 第三部分：多指标累计同比折线图（默认 2024-01 至今） ============
  const dr3 = useChartDateRange(2024, 1);
  const [s3, e3] = useMemo(() => getIndexRange(months, dr3.startStr, dr3.endStr), [dr3]);
  const fm3 = useMemo(() => months.slice(s3, e3), [s3, e3]);
  const accumSeries = useMemo(() => {
    const keys = [
      { key: 'retail_total_accum_yoy', name: '社会消费品零售总额' },
      { key: 'retail_above_limit_accum_yoy', name: '限额以上单位' },
      { key: 'retail_goods_accum_yoy', name: '商品零售' },
      { key: 'retail_online_accum_yoy', name: '网上商品零售额' },
      { key: 'retail_exauto_accum_yoy', name: '除汽车以外' },
      { key: 'retail_catering_accum_yoy', name: '餐饮收入' },
    ];
    return keys.map((k, i) => ({
      name: k.name,
      type: 'line' as const,
      data: sliceData(retailExcelData.data[k.key], months, s3, e3, 'retail'),
      connectNulls: true,
      smooth: true,
      lineStyle: { color: COLORS[i], width: 2 },
      itemStyle: { color: COLORS[i] },
      symbol: 'circle',
      symbolSize: 3,
    }));
  }, [s3, e3]);

  // ============ 第四部分：各指标累计值占比柱状图（默认 2024-01 至今） ============
  const dr4 = useChartDateRange(2024, 1);
  const [s4, e4] = useMemo(() => getIndexRange(months, dr4.startStr, dr4.endStr), [dr4]);
  const fm4 = useMemo(() => months.slice(s4, e4), [s4, e4]);
  const ratioSeries = useMemo(() => {
    const allTotalVals = retailExcelData.data.retail_total_accum_val.slice(s4, e4);
    const items = [
      { key: 'retail_above_limit_accum_val', name: '限额以上单位' },
      { key: 'retail_goods_accum_val', name: '商品零售' },
      { key: 'retail_online_accum_val', name: '网上商品零售额' },
      { key: 'retail_exauto_accum_val', name: '除汽车以外' },
      { key: 'retail_catering_accum_val', name: '餐饮收入' },
    ];

    // 过滤掉 total 为 null 的月份（跳过1月等空值）
    const allMonths = months.slice(s4, e4);
    const validIndices: number[] = [];
    const validMonths: string[] = [];
    for (let i = 0; i < allMonths.length; i++) {
      if (allTotalVals[i] != null) {
        validIndices.push(i);
        validMonths.push(allMonths[i]);
      }
    }

    const series = items.map((item, i) => {
      const rawVals = retailExcelData.data[item.key].slice(s4, e4);
      const ratioData = validIndices.map(idx => {
        const v = rawVals[idx];
        const total = allTotalVals[idx];
        if (v == null || total == null || total === 0) return null;
        return Number(((v as number) / (total as number) * 100).toFixed(1));
      });
      return {
        name: item.name,
        type: 'bar' as const,
        stack: 'total' as const,
        data: ratioData,
        barMaxWidth: 30,
        itemStyle: { color: COLORS[i] },
        emphasis: { focus: 'series' as const },
      };
    });

    return { months: validMonths, series };
  }, [s4, e4]);

      // ============ 第五部分：各指标当月同比柱状图（默认近两年） ============
  const dr5 = useChartDateRange(2024, 5);
  const [s5, e5] = useMemo(() => getIndexRange(months, dr5.startStr, dr5.endStr), [dr5]);
  const fm5All = useMemo(() => months.slice(s5, e5), [s5, e5]);

  // 和折线图不同：柱状图的横轴要跳过 null 月份，且每个图表独立跳过自己为 null 的月份
  function filterNonNull(monthArr: string[], dataArr: (number | null)[]): { months: string[]; values: number[] } {
    const filteredMonths: string[] = [];
    const filteredValues: number[] = [];
    for (let i = 0; i < monthArr.length; i++) {
      if (dataArr[i] != null) {
        filteredMonths.push(monthArr[i]);
        filteredValues.push(dataArr[i] as number);
      }
    }
    return { months: filteredMonths, values: filteredValues };
  }

  // 6 个指标（网上商品零售额仅有累计同比数据，其余用当月同比）
  const monthlyIndicators = [
    { key: 'retail_total_yoy', name: '社会消费品零售总额' },
    { key: 'retail_above_limit_yoy', name: '限额以上单位' },
    { key: 'retail_goods_yoy', name: '商品零售' },
    { key: 'retail_online_accum_yoy', name: '网上商品零售额（累计同比）' },
    { key: 'retail_exauto_yoy', name: '除汽车以外' },
    { key: 'retail_catering_yoy', name: '餐饮收入' },
  ];

  // ============ 第六部分：限额以上单位商品零售分行业同比增速表格（近12个月） ============
  const industryNames = [
    '粮油、食品类', '服装鞋帽针纺织品类', '化妆品类', '金银珠宝类',
    '日用品类', '体育、娱乐用品类', '中西药品类', '文化办公用品类',
    '家具类', '通讯器材类', '石油及制品类', '家用电器和音像器材类',
    '建筑及装潢材料类', '烟酒类', '饮料类', '汽车类',
  ];
  const industryTable = useMemo(() => {
    // 取最近12个月（从最新月份往前取12个有数据的位置）
    const lastIdx = retailExcelData.months.indexOf('2026-05');
    const start = Math.max(0, lastIdx - 11);
    const tableMonths: string[] = [];
    const tableRows: { name: string; values: (number | null)[] }[] = [];

    for (let i = start; i <= lastIdx; i++) {
      tableMonths.push(retailExcelData.months[i]);
    }

    for (const indName of industryNames) {
      const colKey = `industry_${indName}`;
      const raw = retailExcelData.data[colKey];
      const vals = raw.slice(start, lastIdx + 1);
      tableRows.push({ name: indName, values: vals });
    }

    return { months: tableMonths.reverse(), rows: tableRows.map(r => ({
      name: r.name,
      values: [...r.values].reverse(),
    }))};
  }, []);

  // ============ 第七部分（新增）：限额以上单位商品零售分行业累计同比增速表格 ============
  const industryCumTable = useMemo(() => {
    const lastIdx = retailExcelData.months.indexOf('2026-05');
    const start = Math.max(0, lastIdx - 11);
    const tableMonths: string[] = [];
    const tableRows: { name: string; values: (number | null)[] }[] = [];

    for (let i = start; i <= lastIdx; i++) {
      tableMonths.push(retailExcelData.months[i]);
    }

    for (const indName of industryNames) {
      const colKey = `industry_${indName}_cum`;
      const raw = retailExcelData.data[colKey];
      if (!raw) continue;
      const vals = raw.slice(start, lastIdx + 1);
      tableRows.push({ name: indName, values: vals });
    }

    return { months: tableMonths.reverse(), rows: tableRows.map(r => ({
      name: r.name,
      values: [...r.values].reverse(),
    }))};
  }, []);

  return (
    <div className="space-y-4">
      {/* ===== 第一部分 ===== */}
      <ChartCard title={<WindIdHover id="M0001428">社会消费品零售总额同比增速</WindIdHover>} subtitle={`${dr1.startStr} ~ ${dr1.endStr} | ${DATA_SOURCES.retail}`} dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: [{ type: 'line', data: yoyData1, connectNulls: true, smooth: true, lineStyle: { color: '#f59e0b', width: 2 }, itemStyle: { color: '#f59e0b' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(245,158,11,0.15)' }, { offset: 1, color: 'rgba(245,158,11,0)' }] } }, symbol: 'circle', symbolSize: 3 }],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      {/* ===== 第二部分 ===== */}
      <ChartCard title={<WindIdHover id="M0001440">社会消费品零售总额累计同比</WindIdHover>} subtitle={`${dr2.startStr} ~ ${dr2.endStr} | ${DATA_SOURCES.retail}`} dateRange={dr2}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          grid: { top: 10, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm2, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: [{ type: 'line', data: accumYoyData2, connectNulls: true, smooth: true, lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59,130,246,0.15)' }, { offset: 1, color: 'rgba(59,130,246,0)' }] } }, symbol: 'circle', symbolSize: 3 }],
          animationDuration: 500,
        }} style={{ height: 380 }} />
      </ChartCard>

      {/* ===== 第三部分：多指标累计同比合并折线图 ===== */}
      <ChartCard title="社会消费品零售分类累计同比" subtitle={`${dr3.startStr} ~ ${dr3.endStr} | ${DATA_SOURCES.retail}`} dateRange={dr3}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          legend: { data: COLORS_SERIES.map(s => s.name), bottom: 0, textStyle: { color: '#64748b', fontSize: 10 }, icon: 'circle', itemWidth: 8, itemHeight: 8 },
          grid: { top: 10, right: 20, bottom: 50, left: 50 },
          xAxis: { type: 'category', data: fm3, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: accumSeries,
          animationDuration: 500,
        }} style={{ height: 400 }} />
      </ChartCard>

      {/* ===== 第四部分：各指标累计值占比柱状图 ===== */}
      <ChartCard title="各分项累计值占社零总额比重" subtitle={`${dr4.startStr} ~ ${dr4.endStr} | ${DATA_SOURCES.retail}`} dateRange={dr4}>
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
                html += `<div style="display:flex;justify-content:space-between;gap:20px"><span>${p.marker} ${p.seriesName}</span><span style="font-weight:600">${p.value ?? '--'}%</span></div>`;
              });
              return html;
            },
          },
          legend: { data: ['限额以上单位', '商品零售', '网上商品零售额', '除汽车以外', '餐饮收入'], bottom: 0, textStyle: { color: '#64748b', fontSize: 10 }, icon: 'roundRect', itemWidth: 12, itemHeight: 8 },
          grid: { top: 10, right: 20, bottom: 50, left: 55 },
          xAxis: { type: 'category', data: ratioSeries.months, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
          series: ratioSeries.series,
          animationDuration: 500,
        }} style={{ height: 400 }} />
      </ChartCard>

      {/* ===== 第五部分：各指标当月同比柱状图（2行×3列） ===== */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="px-4 py-2.5 border-b border-[#f1f5f9]">
          <h3 className="text-sm font-semibold text-[#1e293b]">各指标当月同比</h3>
          <p className="text-[10px] text-[#94a3b8]">{`${dr5.startStr} ~ ${dr5.endStr} | ${DATA_SOURCES.retail}`}</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4">
            {monthlyIndicators.map((ind, idx) => {
              const raw = sliceData(retailExcelData.data[ind.key], months, s5, e5, 'retail');
              const { months: nonNullMonths, values: nonNullVals } = filterNonNull(fm5All, raw);
              if (nonNullVals.length === 0) {
                return (
                  <div key={ind.key} className="bg-[#f8fafc] rounded-lg p-3 flex items-center justify-center">
                    <p className="text-xs text-[#94a3b8]">暂无数据</p>
                  </div>
                );
              }
              return (
                <div key={ind.key} className="bg-[#f8fafc] rounded-lg p-3">
                  <p className="text-xs text-[#64748b] mb-2 font-medium">{ind.name}</p>
                  <ReactECharts option={{
                    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b', fontSize: 11 } },
                    grid: { top: 5, right: 5, bottom: 25, left: 35 },
                    xAxis: { type: 'category', data: nonNullMonths, axisLabel: { color: '#94a3b8', fontSize: 8, rotate: 45 }, axisLine: { show: false }, axisTick: { show: false } },
                    yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 8 }, axisLabel: { color: '#94a3b8', fontSize: 8 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
                    series: [{
                      type: 'bar',
                      data: nonNullVals,
                      barMaxWidth: 8,
                      itemStyle: {
                        color: (params: any) => {
                          const val = params.value;
                          return val != null && val >= 0 ? '#ef4444' : '#22c55e';
                        },
                      },
                    }],
                  }} style={{ height: 200 }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== 第六部分：限额以上单位商品零售分行业同比增速表格 ===== */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="px-4 py-2.5 border-b border-[#f1f5f9]">
          <h3 className="text-sm font-semibold text-[#1e293b]">限额以上单位商品零售分行业同比增速</h3>
          <p className="text-[10px] text-[#94a3b8]">{`${industryTable.months[industryTable.months.length - 1]} ~ ${industryTable.months[0]} | ${DATA_SOURCES.retail}`}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <th className="text-left px-3 py-2 text-[#64748b] font-medium whitespace-nowrap">行业</th>
                {industryTable.months.map(m => (
                  <th key={m} className="text-right px-3 py-2 text-[#64748b] font-medium whitespace-nowrap">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {industryTable.rows.map((row, ri) => (
                <tr key={row.name} className={ri % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                  <td className="px-3 py-2 text-[#334155] whitespace-nowrap border-r border-[#f1f5f9]">
                    {retailWindId(row.name) ? (
                      <WindIdHover id={retailWindId(row.name)}>{row.name}</WindIdHover>
                    ) : row.name}
                  </td>
                  {row.values.map((v, vi) => (
                    <td key={vi} className="text-center px-2 py-1.5 tabular-nums font-mono text-[11px]"
                      style={v != null ? { backgroundColor: HEAT_COLORS.getBg(v), color: HEAT_COLORS.getText(v) } : {}}>
                      {v != null ? `${v >= 0 ? '+' : ''}${v}%` : '--'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== 第七部分（新增）：限额以上单位商品零售分行业累计同比增速表格 ===== */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        <div className="px-4 py-2.5 border-b border-[#f1f5f9]">
          <h3 className="text-sm font-semibold text-[#1e293b]">限额以上单位商品零售分行业累计同比增速</h3>
          <p className="text-[10px] text-[#94a3b8]">{`${industryCumTable.months[industryCumTable.months.length - 1]} ~ ${industryCumTable.months[0]} | ${DATA_SOURCES.retail}`}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <th className="text-left px-3 py-2 text-[#64748b] font-medium whitespace-nowrap">行业</th>
                {industryCumTable.months.map(m => (
                  <th key={m} className="text-right px-3 py-2 text-[#64748b] font-medium whitespace-nowrap">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {industryCumTable.rows.map((row, ri) => (
                <tr key={row.name} className={ri % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                  <td className="px-3 py-2 text-[#334155] whitespace-nowrap border-r border-[#f1f5f9]">
                    {retailCumWindId(row.name) ? (
                      <WindIdHover id={retailCumWindId(row.name)}>{row.name}</WindIdHover>
                    ) : row.name}
                  </td>
                  {row.values.map((v, vi) => (
                    <td key={vi} className="text-center px-2 py-1.5 tabular-nums font-mono text-[11px]"
                      style={v != null ? { backgroundColor: HEAT_COLORS.getBg(v), color: HEAT_COLORS.getText(v) } : {}}>
                      {v != null ? `${v >= 0 ? '+' : ''}${v}%` : '--'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== 指标解释 ===== */}
      <IndicatorExplanation
        title="社会消费品零售总额指标说明"
        items={[
          { label: '指标定义', content: '社会消费品零售总额指企业（单位、个体户）通过交易售给个人、社会集团非生产、非经营用的实物商品金额，以及提供餐饮服务所取得的收入金额。' },
          { label: '限额以上单位', content: '限额以上单位是指年主营业务收入达到一定规模以上的批发和零售业、住宿和餐饮业企业。具体标准为：批发业年主营业务收入2000万元及以上；零售业年主营业务收入500万元及以上；住宿和餐饮业年主营业务收入200万元及以上。限额以上单位的数据相对完整和规范，是国家统计局重点监测的对象。' },
          { label: '数据来源', content: '国家统计局（www.stats.gov.cn），每月中旬公布上月数据。' },
          { label: '指标意义', content: '社零是衡量消费景气度的核心指标，占GDP比重约40%。增速>8%表明消费旺盛，<3%需关注消费疲软。' },
        ]}
      />
    </div>
  );
}

export default RetailModule;
