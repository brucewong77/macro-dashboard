import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import { loadMacroData, formatValue, formatChange } from "../data/api";
import type { MacroData } from "../data/api";

interface IndicatorDetailProps {
  indicatorKey: string;
  title: string;
  description: string;
}

export default function IndicatorDetail({ indicatorKey, title, description }: IndicatorDetailProps) {
  const [data, setData] = useState<MacroData | null>(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    loadMacroData().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!data || !chartRef.current) return;
    const indicator = data.indicators[indicatorKey];
    if (!indicator || !indicator.history) return;

    try {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }

      const history = indicator.history.filter((h) => h.value !== null);
      const dates = history.map((h) => h.date);
      const values = history.map((h) => h.value);

      const option: echarts.EChartsOption = {
        title: {
          text: `${indicator.name}走势`,
          left: "center",
          textStyle: { fontSize: 16, fontWeight: "normal" },
        },
        tooltip: {
          trigger: "axis",
          formatter: (params: any) => {
            const p = params[0];
            return `<div style="font-weight:bold">${p.axisValue}</div><div>${indicator.name}: ${p.value}${indicator.unit}</div>`;
          },
        },
        grid: { left: 50, right: 20, top: 50, bottom: 40 },
        xAxis: {
          type: "category",
          data: dates,
          axisLabel: { rotate: 45, fontSize: 11 },
        },
        yAxis: {
          type: "value",
          axisLabel: { formatter: `{value}${indicator.unit}` },
        },
        series: [
          {
            name: indicator.name,
            type: "line",
            data: values,
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: { color: "#1890ff", width: 2 },
            itemStyle: { color: "#1890ff" },
            areaStyle: {
              color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(24,144,255,0.3)" },
                { offset: 1, color: "rgba(24,144,255,0.05)" },
              ]),
            },
          },
        ],
      };

      chartInstance.current.setOption(option, true);

      const handleResize = () => chartInstance.current?.resize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    } catch (err) {
      console.error("图表初始化失败:", err);
    }
  }, [data, indicatorKey]);

  if (loading || !data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <div style={{ textAlign: "center", color: "#666" }}>正在加载数据...</div>
      </div>
    );
  }

  const indicator = data.indicators[indicatorKey];
  if (!indicator) {
    return <div style={{ padding: 40, textAlign: "center", color: "#999" }}>暂无该指标数据</div>;
  }

  const changeInfo = formatChange(indicator.change, indicator.change_pct);

  return (
    <div>
      <div style={styles.descCard}>
        <h2 style={styles.descTitle}>{title}</h2>
        <p style={styles.descText}>{description}</p>
      </div>

      <div style={styles.metricGrid}>
        <MetricCard label="当前值" value={formatValue(indicator.value, indicator.unit)} />
        <MetricCard label="前值" value={formatValue(indicator.prev, indicator.unit)} />
        <MetricCard
          label="环比变化"
          value={changeInfo.text}
          color={changeInfo.type === "up" ? "#389e0d" : changeInfo.type === "down" ? "#cf1322" : "#999"}
        />
        <MetricCard label="数据日期" value={indicator.date || "—"} />
      </div>

      <div style={styles.chartCard}>
        <div ref={chartRef} style={{ width: "100%", height: 400 }} />
      </div>

      <div style={styles.tableCard}>
        <h3 style={styles.tableTitle}>📋 历史数据</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>时间</th>
              <th style={styles.th}>数值</th>
            </tr>
          </thead>
          <tbody>
            {[...indicator.history].reverse().map((item, idx) => (
              <tr key={idx} style={idx % 2 === 0 ? styles.trEven : {}}>
                <td style={styles.td}>{item.date}</td>
                <td style={styles.td}>
                  {item.value !== null ? `${item.value}${indicator.unit}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color = "#1f1f1f" }: { label: string; value: string; color?: string }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={{ ...styles.metricValue, color }}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  descCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    border: "1px solid #f0f0f0",
  },
  descTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 8,
    color: "#1f1f1f",
  },
  descText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 1.6,
  },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 20,
  },
  metricCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    border: "1px solid #f0f0f0",
  },
  metricLabel: {
    fontSize: 13,
    color: "#999",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 700,
  },
  chartCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    border: "1px solid #f0f0f0",
  },
  tableCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    border: "1px solid #f0f0f0",
  },
  tableTitle: {
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 16,
    color: "#1f1f1f",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "2px solid #f0f0f0",
    color: "#666",
    fontWeight: 500,
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #f5f5f5",
    color: "#333",
  },
  trEven: {
    background: "#fafafa",
  },
};
