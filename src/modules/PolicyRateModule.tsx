import { useMemo, useState, useCallback } from 'react';
import { ChartCard } from '../components/ChartCard';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { months, rateData, getIndexRange } from '../data/economicData';
import { dailyRateData } from '../data/dailyRateData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';


// 日频数据日期范围选择 hook
function useDailyDateRange() {
  const allDates = dailyRateData.dates;
  const [startDate, setStartDate] = useState('2015-01-01');
  const [endDate, setEndDate] = useState(allDates[allDates.length - 1]);

  const applyPreset = useCallback((label: string) => {
    const lastIdx = allDates.length - 1;
    switch (label) {
      case '近1月':
        setStartDate(allDates[Math.max(0, lastIdx - 30)]);
        break;
      case '近3月':
        setStartDate(allDates[Math.max(0, lastIdx - 90)]);
        break;
      case '近6月':
        setStartDate(allDates[Math.max(0, lastIdx - 180)]);
        break;
      case '近1年':
        setStartDate(allDates[Math.max(0, lastIdx - 365)]);
        break;
      case '近2年':
        setStartDate(allDates[Math.max(0, lastIdx - 730)]);
        break;
      case '近5年':
        setStartDate(allDates[Math.max(0, lastIdx - 1825)]);
        break;
      case '全部':
        setStartDate(allDates[0]);
        break;
    }
    setEndDate(allDates[lastIdx]);
  }, [allDates]);

  const isPresetActive = useCallback((label: string) => {
    const lastIdx = allDates.length - 1;
    switch (label) {
      case '近1月': return startDate === allDates[Math.max(0, lastIdx - 30)] && endDate === allDates[lastIdx];
      case '近3月': return startDate === allDates[Math.max(0, lastIdx - 90)] && endDate === allDates[lastIdx];
      case '近6月': return startDate === allDates[Math.max(0, lastIdx - 180)] && endDate === allDates[lastIdx];
      case '近1年': return startDate === allDates[Math.max(0, lastIdx - 365)] && endDate === allDates[lastIdx];
      case '近2年': return startDate === allDates[Math.max(0, lastIdx - 730)] && endDate === allDates[lastIdx];
      case '近5年': return startDate === allDates[Math.max(0, lastIdx - 1825)] && endDate === allDates[lastIdx];
      case '全部': return startDate === allDates[0] && endDate === allDates[lastIdx];
    }
    return false;
  }, [allDates, startDate, endDate]);

  const [s, e] = useMemo(() => {
    let si = allDates.indexOf(startDate);
    let ei = allDates.indexOf(endDate);
    if (si === -1) si = 0;
    if (ei === -1) ei = allDates.length - 1;
    return [si, ei + 1];
  }, [allDates, startDate, endDate]);

  const sliceDates = useMemo(() => allDates.slice(s, e), [allDates, s, e]);

  return { allDates, startDate, endDate, setStartDate, setEndDate, applyPreset, isPresetActive, s, e, sliceDates };
}

export function PolicyRateModule() {
  const dr1 = useChartDateRange();
  const [s1, e1] = useMemo(() => getIndexRange(months, dr1.startStr, dr1.endStr), [dr1.startStr, dr1.endStr]);
  const fm1 = useMemo(() => months.slice(s1, e1), [s1, e1]);

  const daily = useDailyDateRange();

  // 日频图表配置
  const dailyOption = useMemo(() => {
    const { sliceDates, s: ds, e: de } = daily;
    return {
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#1e293b', fontSize: 11 },
        formatter: (params: any[]) => {
          if (!params || !params.length) return '';
          const date = params[0].axisValue;
          let result = `<div style="font-weight:600;margin-bottom:4px">${date}</div>`;
          params.forEach((p: any) => {
            const color = typeof p.color === 'string' ? p.color : p.color?.colorStops?.[0]?.color || '#666';
            result += `<div style="display:flex;align-items:center;gap:6px">
              <span style="display:inline-block;width:8px;height:3px;background:${color};border-radius:2px"></span>
              <span style="flex:1">${p.seriesName}:</span>
              <span style="font-weight:600">${p.value}%</span>
            </div>`;
          });
          return result;
        },
      },
      legend: {
        data: ['DR007', '逆回购7天利率', '隔夜逆回购利率上限', '隔夜逆回购利率下限'],
        top: 5,
        textStyle: { color: '#64748b', fontSize: 11 },
      },
      grid: { top: 50, right: 20, bottom: 60, left: 50 },
      xAxis: {
        type: 'category',
        data: sliceDates,
        axisLabel: {
          color: '#64748b',
          fontSize: 10,
          formatter: (value: string) => {
            const d = new Date(value);
            const y = d.getFullYear();
            const m = d.getMonth() + 1;
            return `${y}-${String(m).padStart(2, '0')}`;
          },
        },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value',
        name: '%',
        nameTextStyle: { color: '#94a3b8', fontSize: 10 },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } },
      },
      dataZoom: [
        { type: 'inside' as const, start: 0, end: 100 },
        {
          type: 'slider' as const,
          start: 0,
          end: 100,
          height: 20,
          bottom: 10,
          borderColor: '#e2e8f0',
          fillerColor: 'rgba(37,99,235,0.1)',
          handleStyle: { color: '#2563eb' },
          textStyle: { color: '#64748b', fontSize: 10 },
        },
      ],
      series: [
        {
          name: 'DR007',
          type: 'line',
          data: dailyRateData.dr007.slice(ds, de),
          lineStyle: { color: '#ef4444', width: 1.5 },
          itemStyle: { color: '#ef4444' },
          symbol: 'none',
          showSymbol: false,
        },
        {
          name: '逆回购7天利率',
          type: 'line',
          data: dailyRateData.repo7d.slice(ds, de),
          lineStyle: { color: '#2563eb', width: 2 },
          itemStyle: { color: '#2563eb' },
          symbol: 'none',
          showSymbol: false,
          step: 'end' as const,
        },
        {
          name: '隔夜逆回购利率上限',
          type: 'line',
          data: dailyRateData.overnightUpper.slice(ds, de),
          lineStyle: { color: '#94a3b8', width: 1, type: 'dashed' as const },
          itemStyle: { color: '#94a3b8' },
          symbol: 'none',
          showSymbol: false,
        },
        {
          name: '隔夜逆回购利率下限',
          type: 'line',
          data: dailyRateData.overnightLower.slice(ds, de),
          lineStyle: { color: '#f9a8d4', width: 1, type: 'dashed' as const },
          itemStyle: { color: '#f9a8d4' },
          symbol: 'none',
          showSymbol: false,
        },
      ],
      animationDuration: 300,
    };
  }, [daily]);

  return (
    <div className="space-y-4">
      <ChartCard title="政策利率走势" dateRange={dr1}>
        <ReactECharts option={{
          tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
          legend: { data: ['MLF利率', '1年LPR', '5年LPR', '7天逆回购', '14天逆回购'], top: 5, textStyle: { color: '#64748b', fontSize: 10 }, type: 'scroll' as const },
          grid: { top: 50, right: 20, bottom: 30, left: 50 },
          xAxis: { type: 'category', data: fm1, axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: { type: 'value', name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, min: 0, max: 5, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
          series: [
            { name: 'MLF利率', type: 'line', data: rateData.mlfRate.slice(s1, e1), lineStyle: { color: '#ef4444', width: 2 }, itemStyle: { color: '#ef4444' }, symbol: 'circle', symbolSize: 3 },
            { name: '1年LPR', type: 'line', data: rateData.lpr1y.slice(s1, e1), lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' }, symbol: 'circle', symbolSize: 3 },
            { name: '5年LPR', type: 'line', data: rateData.lpr5y.slice(s1, e1), lineStyle: { color: '#22c55e', width: 2 }, itemStyle: { color: '#22c55e' }, symbol: 'circle', symbolSize: 3 },
            { name: '7天逆回购', type: 'line', data: rateData.repo7d.slice(s1, e1), lineStyle: { color: '#f59e0b', width: 2 }, itemStyle: { color: '#f59e0b' }, symbol: 'circle', symbolSize: 3 },
            { name: '14天逆回购', type: 'line', data: rateData.repo14d.slice(s1, e1), lineStyle: { color: '#8b5cf6', width: 2 }, itemStyle: { color: '#8b5cf6' }, symbol: 'circle', symbolSize: 3 },
          ],
          animationDuration: 500,
        }} style={{ height: 400 }} />
      </ChartCard>

      {/* 日频图表：带时间段选择器 */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
        {/* 标题栏 + 时间段选择 */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[#f1f5f9]">
          <div>
            <h3 className="text-sm font-semibold text-[#1e293b]">DR007 与 逆回购7天利率（日频）</h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">{daily.startDate} ~ {daily.endDate}</p>
          </div>
          {/* 时间段选择 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 开始日期 */}
            <input
              type="date"
              className="border border-[#e2e8f0] rounded-md px-2 py-1 text-xs text-[#1e293b] bg-white"
              value={daily.startDate}
              min={daily.allDates[0]}
              max={daily.endDate}
              onChange={(e) => {
                const v = e.target.value;
                if (v >= daily.allDates[0] && v <= daily.endDate) {
                  daily.setStartDate(v);
                }
              }}
            />
            <span className="text-[#94a3b8] text-xs">~</span>
            {/* 结束日期 */}
            <input
              type="date"
              className="border border-[#e2e8f0] rounded-md px-2 py-1 text-xs text-[#1e293b] bg-white"
              value={daily.endDate}
              min={daily.startDate}
              max={daily.allDates[daily.allDates.length - 1]}
              onChange={(e) => {
                const v = e.target.value;
                if (v >= daily.startDate && v <= daily.allDates[daily.allDates.length - 1]) {
                  daily.setEndDate(v);
                }
              }}
            />
            {/* 快捷按钮 */}
            <div className="flex items-center gap-0.5">
              {['近1月', '近3月', '近6月', '近1年', '近2年', '近5年', '全部'].map(label => (
                <button
                  key={label}
                  onClick={() => daily.applyPreset(label)}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                    daily.isPresetActive(label)
                      ? 'bg-[#2563eb] text-white'
                      : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* 图表 */}
        <div className="p-4">
          <ReactECharts option={dailyOption} style={{ height: 420 }} />
        </div>
      </div>
    </div>
  );
}


      <div className="mt-4 space-y-4">
        <IndicatorExplanation
          title="政策利率指标说明"
          items={[
            { label: 'MLF（中期借贷便利）', content: '央行向商业银行提供的1年期中期资金利率，是LPR的定价锚。2024年7月降至2.30%。' },
            { label: 'LPR（贷款市场报价利率）', content: '商业银行对其最优质客户执行的贷款利率，由18家报价行根据MLF加点形成。分为1年期和5年期。' },
            { label: '7天逆回购利率', content: '央行向一级交易商开展的7天期短期资金操作利率，是短期政策利率，目前为1.40%。' },
            { label: '数据来源', content: '中国人民银行（www.pbc.gov.cn），每月20日公布LPR，其他利率按需调整。' },
          ]}
        />
        <IndicatorExplanation
          title="DR007指标说明"
          items={[
            { label: '指标定义', content: 'DR007是银行间市场存款类机构以利率债为质押的7天期回购加权平均利率，反映银行间市场短期资金成本。' },
            { label: '数据来源', content: '中国货币网（www.chinamoney.com.cn），每个交易日公布。' },
            { label: '指标意义', content: 'DR007是货币市场基准利率，围绕7天逆回购利率波动。持续高于政策利率表明资金面偏紧。' },
          ]}
        />
      </div>


export default PolicyRateModule;
