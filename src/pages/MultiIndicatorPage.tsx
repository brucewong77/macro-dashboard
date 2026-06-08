import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import { loadMacroData, formatValue, formatChange } from "../data/api";
import type { MacroData } from "../data/api";

interface IndicatorConfig {
  key: string;
  name: string;
  desc: string;
}

interface MultiIndicatorPageProps {
  title: string;
  description: string;
  indicators: IndicatorConfig[];
}

/** 单个指标的图表 + 数据表格卡片 */
function IndicatorCard({ data, config }: { data: MacroData; config: IndicatorConfig }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const indicator = data.indicators[config.key];

  useEffect(() => {
    if (!indicator?.history || !chartRef.current) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }
    const history = indicator.history.filter((h) => h.value !== null);
    const option: echarts.EChartsOption = {
      title: { text: `${indicator.name}走势`, left: "center", textStyle: { fontSize: 14, fontWeight: "normal" } },
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const p = params[0];
          return `<b>${p.axisValue}</b><br/>${indicator.name}: ${p.value ?? "—"}${indicator.unit}`;
        },
      },
      grid: { left: 50, right: 20, top: 44, bottom: 40 },
      xAxis: { type: "category", data: history.map((h) => h.date), axisLabel: { rotate: 45, fontSize: 10 } },
      yAxis: { type: "value", axisLabel: { formatter: `{value}${indicator.unit}` } },
      series: [{
        name: indicator.name,
        type: "line",
        data: history.map((h) => h.value),
        smooth: true,
        symbol: "circle",
        symbolSize: 5,
        lineStyle: { color: "#1890ff", width: 2 },
        itemStyle: { color: "#1890ff" },
        areaStyle: {
          color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(24,144,255,0.25)" },
            { offset: 1, color: "rgba(24,144,255,0.02)" },
          ]),
        },
      }],
    };
    chartInstance.current.setOption(option, true);
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [indicator]);

  if (!indicator) {
    return (
      <div style={styles.block}>
        <p style={{ color: "#999", textAlign: "center", padding: 40 }}>暂无数据</p>
      </div>
    );
  }

  const changeInfo = formatChange(indicator.change, indicator.change_pct);
  const isBad = changeInfo.type === "down";

  return (
    <div style={styles.block}>
      {/* 头部摘要 */}
      <div style={styles.blockHeader}>
        <div>
          <div style={styles.blockName}>{indicator.name}</div>
          <div style={styles.blockDate}>{indicator.date || ""}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={styles.blockValue}>{formatValue(indicator.value, indicator.unit)}</div>
          <span style={{ ...styles.changeBadge, background: isBad ? "#fff1f0" : "#f6ffed", color: isBad ? "#cf1322" : "#389e0d" }}>
            {changeInfo.type === "up" ? "↗" : changeInfo.type === "down" ? "↘" : "→"} 环比 {changeInfo.text}
          </span>
        </div>
      </div>
      <p style={styles.blockDesc}>{config.desc}</p>

      {/* 图表 */}
      <div ref={chartRef} style={{ width: "100%", height: 280, marginBottom: 16 }} />

      {/* 历史数据表 */}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>时间</th>
              <th style={styles.th}>数值</th>
            </tr>
          </thead>
          <tbody>
            {[...indicator.history].reverse().map((item, idx) => (
              <tr key={idx} style={idx % 2 === 0 ? { background: "#fafafa" } : {}}>
                <td style={styles.td}>{item.date}</td>
                <td style={styles.td}>{item.value !== null ? `${item.value}${indicator.unit}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MultiIndicatorPage({ title, description, indicators }: MultiIndicatorPageProps) {
  const [data, setData] = useState<MacroData | null>(null);

  useEffect(() => {
    loadMacroData().then(setData);
  }, []);

  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "#666" }}>加载中...</div>;

  return (
    <div>
      <div style={styles.descCard}>
        <h2 style={styles.descTitle}>{title}</h2>
        <p style={styles.descText}>{description}</p>
      </div>
      {indicators.map((cfg) => (
        <IndicatorCard key={cfg.key} data={data} config={cfg} />
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  descCard: {
    background: "#fff", borderRadius: 12, padding: 24, marginBottom: 20,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0",
  },
  descTitle: { fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#1f1f1f" },
  descText: { fontSize: 14, color: "#666", lineHeight: 1.6 },
  block: {
    background: "#fff", borderRadius: 12, padding: 20, marginBottom: 20,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0",
  },
  blockHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  blockName: { fontSize: 15, fontWeight: 600, color: "#1f1f1f" },
  blockDate: { fontSize: 12, color: "#999", marginTop: 2 },
  blockValue: { fontSize: 28, fontWeight: 700, color: "#1f1f1f" },
  changeBadge: {
    display: "inline-block", padding: "2px 8px", borderRadius: 4,
    fontSize: 12, fontWeight: 500, marginTop: 4,
  },
  blockDesc: { fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 12 },
  tableWrap: { maxHeight: 240, overflowY: "auto", borderRadius: 8, border: "1px solid #f0f0f0" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left" as const, padding: "8px 12px", borderBottom: "2px solid #f0f0f0", color: "#666", fontWeight: 500, background: "#fafafa" },
  td: { padding: "8px 12px", borderBottom: "1px solid #f5f5f5", color: "#333" },
};
