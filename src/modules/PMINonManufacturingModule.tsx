import { useMemo } from 'react';
import { ChartCard } from '../components/ChartCard';
import { months, pmiData } from '../data/economicData';
import { DATA_SOURCES } from '../data/realData';
import ReactECharts from 'echarts-for-react';
import { IndicatorExplanation } from '../components/IndicatorExplanation';

export function PMINonManufacturingModule() {
  // 非制造业PMI走势图
  const nonMfgOption = useMemo(() => {
    const cy = 2026;
    const cyData: (number | null)[] = [];
    const pyData: (number | null)[] = [];
    const p2yData: (number | null)[] = [];
    for (let m = 1; m <= 12; m++) {
      const ms = `${cy}-${String(m).padStart(2,'0')}`;
      const idx = months.indexOf(ms);
      cyData.push(idx >= 0 ? pmiData.nonManufacturing[idx]! : null);
      const pms = `${cy-1}-${String(m).padStart(2,'0')}`;
      const pidx = months.indexOf(pms);
      pyData.push(pidx >= 0 ? pmiData.nonManufacturing[pidx]! : null);
      const p2ms = `${cy-2}-${String(m).padStart(2,'0')}`;
      const p2idx = months.indexOf(p2ms);
      p2yData.push(p2idx >= 0 ? pmiData.nonManufacturing[p2idx]! : null);
    }
    const allV = [...cyData, ...pyData, ...p2yData].filter(v => v !== null) as number[];
    const minV = Math.min(...allV);
    const maxV = Math.max(...allV);
    return {
      tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
      legend: { data: ['2026年', '2025年', '2024年'], top: 5, textStyle: { color: '#64748b', fontSize: 11 } },
      grid: { top: 40, right: 30, bottom: 30, left: 50 },
      xAxis: { type: 'category', data: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'], axisLabel: { color: '#64748b', fontSize: 10 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', min: Math.floor(minV-1), max: Math.ceil(maxV+1), name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
      series: [
        { name: '2026年', type: 'line', data: cyData, lineStyle: { color: '#ef4444', width: 2.5 }, itemStyle: { color: '#ef4444' }, symbol: 'circle', symbolSize: 5, label: { show: true, color: '#ef4444', fontSize: 9, fontWeight: 'bold', position: 'top' } },
        { name: '2025年', type: 'line', data: pyData, lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' }, symbol: 'circle', symbolSize: 4 },
        { name: '2024年', type: 'line', data: p2yData, lineStyle: { color: '#94a3b8', width: 1.5, type: 'dashed' as const }, itemStyle: { color: '#94a3b8' }, symbol: 'circle', symbolSize: 3 },
      ],
      animationDuration: 500,
    };
  }, []);

  // 财新PMI走势图
  const caixinOption = useMemo(() => {
    const cy = 2026;
    const cyData: (number | null)[] = [];
    const pyData: (number | null)[] = [];
    for (let m = 1; m <= 12; m++) {
      const ms = `${cy}-${String(m).padStart(2,'0')}`;
      const idx = months.indexOf(ms);
      cyData.push(idx >= 0 ? pmiData.caixin[idx]! : null);
      const pms = `${cy-1}-${String(m).padStart(2,'0')}`;
      const pidx = months.indexOf(pms);
      pyData.push(pidx >= 0 ? pmiData.caixin[pidx]! : null);
    }
    const allV = [...cyData, ...pyData].filter(v => v !== null) as number[];
    const minV = Math.min(...allV);
    const maxV = Math.max(...allV);
    return {
      tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } },
      legend: { data: ['2026年', '2025年'], top: 5, textStyle: { color: '#64748b', fontSize: 11 } },
      grid: { top: 40, right: 30, bottom: 30, left: 50 },
      xAxis: { type: 'category', data: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'], axisLabel: { color: '#64748b', fontSize: 10 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', min: Math.floor(minV-1), max: Math.ceil(maxV+1), name: '%', nameTextStyle: { color: '#94a3b8', fontSize: 10 }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' as const } } },
      series: [
        { name: '2026年', type: 'line', data: cyData, lineStyle: { color: '#8b5cf6', width: 2.5 }, itemStyle: { color: '#8b5cf6' }, symbol: 'circle', symbolSize: 5, label: { show: true, color: '#8b5cf6', fontSize: 9, fontWeight: 'bold', position: 'top' }, markLine: { silent: true, symbol: 'none', data: [{ yAxis: 50, lineStyle: { color: '#94a3b8', type: 'dashed', width: 1 } }] } },
        { name: '2025年', type: 'line', data: pyData, lineStyle: { color: '#06b6d4', width: 2 }, itemStyle: { color: '#06b6d4' }, symbol: 'circle', symbolSize: 4 },
      ],
      animationDuration: 500,
    };
  }, []);

  // PMI雷达图：展示2026年最新各月细分项对比
  const radarOption = useMemo(() => {
    const indicators = [
      { name: '生产', max: 60, min: 40 },
      { name: '新订单', max: 60, min: 40 },
      { name: '原材料库存', max: 60, min: 40 },
      { name: '从业人员', max: 60, min: 40 },
      { name: '供应商配送', max: 60, min: 40 },
      { name: '新出口订单', max: 60, min: 40 },
      { name: '进口', max: 60, min: 40 },
      { name: '采购量', max: 60, min: 40 },
    ];
    const recent3M = ['2026-03', '2026-04', '2026-05'];
    const colors = ['#ef4444', '#3b82f6', '#22c55e'];
    return {
      tooltip: { trigger: 'item' as const },
      legend: { data: recent3M, bottom: 0, textStyle: { color: '#64748b', fontSize: 10 } },
      radar: {
        indicator: indicators,
        shape: 'polygon' as const,
        splitNumber: 4,
        axisName: { color: '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
        splitArea: { show: true, areaStyle: { color: ['rgba(241,245,249,0.3)', 'rgba(241,245,249,0.6)'] } },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      series: [{
        type: 'radar',
        data: recent3M.map((ms, mi) => {
          const mIdx = months.indexOf(ms);
          const values = pmiData.heatmapItems.map((_: string, i: number) => {
            const existing = pmiData.heatmapData.find((h: any) => h[0] === mIdx && h[1] === i);
            return existing ? existing[2] : 50;
          });
          return {
            value: values,
            name: ms,
            lineStyle: { color: colors[mi], width: 2 },
            itemStyle: { color: colors[mi] },
            areaStyle: { color: colors[mi], opacity: 0.1 },
          };
        }),
      }],
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* 非制造业PMI走势图 */}
      <ChartCard title="非制造业PMI走势（2026 vs 2025 vs 2024）">
        <p className="text-[10px] text-[#94a3b8] mb-2">{DATA_SOURCES.pmi}</p>
        <ReactECharts option={nonMfgOption} style={{ height: 380 }} />
      </ChartCard>

      {/* 财新PMI走势图 */}
      <ChartCard title="财新PMI走势（2026 vs 2025）">
        <p className="text-[10px] text-[#94a3b8] mb-2">{DATA_SOURCES.pmi}</p>
        <ReactECharts option={caixinOption} style={{ height: 380 }} />
      </ChartCard>

      {/* PMI细分项雷达图 */}
      <ChartCard title="制造业PMI细分项雷达图（2026年最近3个月对比）">
        <p className="text-[10px] text-[#94a3b8] mb-2">{DATA_SOURCES.pmi}</p>
        <ReactECharts option={radarOption} style={{ height: 420 }} />
      </ChartCard>

      {/* 指标说明 */}
      <IndicatorExplanation
        title="非制造业PMI与财新PMI指标说明"
        items={[
          { label: '非制造业PMI', content: '反映服务业和建筑业等非制造业领域的经济活动状况，包括商务活动、新订单、投入价格等10个分项指数。50为荣枯线。' },
          { label: '财新PMI', content: '由财新传媒与IHS Markit联合发布，样本覆盖420家制造业企业，更偏向中小型和出口导向型企业，与官方PMI形成互补。' },
          { label: '数据来源', content: '官方PMI：国家统计局；财新PMI：财新传媒。均每月最后一天公布。' },
          { label: '指标意义', content: '非制造业PMI反映服务业景气度；财新PMI对中小企业和出口部门更敏感，两者结合可全面把握经济走势。' },
        ]}
      />
    </div>
  );
}

export default PMINonManufacturingModule;
