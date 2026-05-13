import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import { loadMacroData, formatValue, formatChange, type MacroData } from "../data/api";

const CARD_ORDER = ["gdp", "cpi", "ppi", "pmi"];

const QUICK_INDICATORS = [
  "shrzgm",
  "m2",
  "export",
  "retail_sales",
  "fixed_asset_investment",
  "unemployment",
  "fx_reserves",
  "lpr",
];

export default function Dashboard() {
  const [data, setData] = useState<MacroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const macroData = await loadMacroData();
      setData(macroData);
    } catch (err) {
      setError("数据加载失败，请稍后重试");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchData();
  }, []);

  // 自动刷新：每 5 分钟
  useEffect(() => {
    const timer = setInterval(() => {
      fetchData();
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // 初始化/更新图表
  useEffect(() => {
    if (!data || !chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const cpi = data.indicators.cpi?.history || [];
    const ppi = data.indicators.ppi?.history || [];

    const dates = cpi.map((d) => d.date);
    const cpiValues = cpi.map((d) => d.value);
    const ppiValues = ppi.map((d) => d.value);

    const option: echarts.EChartsOption = {
      title: {
        text: "CPI & PPI 走势",
        left: "center",
        textStyle: { fontSize: 16, fontWeight: "normal" },
      },
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          let html = `<div style="font-weight:bold;margin-bottom:4px">${params[0].axisValue}</div>`;
          params.forEach((p: any) => {
            html += `<div style="display:flex;align-items:center;gap:6px">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
              <span>${p.seriesName}: ${p.value ?? "—"}%</span>
            </div>`;
          });
          return html;
        },
      },
      legend: {
        data: ["CPI同比", "PPI同比"],
        bottom: 0,
      },
      grid: {
        left: 40,
        right: 20,
        top: 50,
        bottom: 40,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: dates,
        axisLabel: { rotate: 45, fontSize: 11 },
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: "{value}%" },
      },
      series: [
        {
          name: "CPI同比",
          type: "line",
          data: cpiValues,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { color: "#5470c6", width: 2 },
          itemStyle: { color: "#5470c6" },
          areaStyle: {
            color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(84,112,198,0.3)" },
              { offset: 1, color: "rgba(84,112,198,0.05)" },
            ]),
          },
        },
        {
          name: "PPI同比",
          type: "line",
          data: ppiValues,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { color: "#91cc75", width: 2 },
          itemStyle: { color: "#91cc75" },
        },
      ],
    };

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data]);

  if (loading && !data) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <p style={{ marginTop: 16, color: "#666" }}>正在加载宏观经济数据...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <p style={{ color: "#cf1322", marginBottom: 12 }}>{error}</p>
          <button style={styles.refreshBtn} onClick={fetchData}>
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={styles.container}>
      {/* 头部 */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>📊 宏观经济数据看板</h1>
          <p style={styles.subtitle}>
            更新时间: {data.update_time}
            {loading && <span style={{ color: "#1890ff", marginLeft: 8 }}>刷新中...</span>}
          </p>
        </div>
        <button style={styles.refreshBtn} onClick={fetchData} disabled={loading}>
          🔄 刷新数据
        </button>
      </header>

      {/* 顶部指标卡片 */}
      <div style={styles.cardGrid}>
        {CARD_ORDER.map((key) => {
          const indicator = data.indicators[key];
          if (!indicator) return null;
          const changeInfo = formatChange(indicator.change, indicator.change_pct);
          const isReverseBad = key === "pmi"; // PMI < 50 为收缩
          const isBad = isReverseBad
            ? (indicator.value ?? 50) < 50
            : changeInfo.type === "down";

          return (
            <div key={key} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardName}>{indicator.name}</span>
                <span style={{ ...styles.cardDate, color: "#999" }}>
                  {indicator.date || ""}
                </span>
              </div>
              <div style={styles.cardValue}>
                {formatValue(indicator.value, indicator.unit)}
              </div>
              <div style={styles.cardChange}>
                <span
                  style={{
                    ...styles.changeBadge,
                    background: isBad ? "#fff1f0" : "#f6ffed",
                    color: isBad ? "#cf1322" : "#389e0d",
                  }}
                >
                  {changeInfo.type === "up" ? "↗" : changeInfo.type === "down" ? "↘" : "→"}
                  {"环比"}
                  {changeInfo.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 中间区域：图表 + 侧边栏 */}
      <div style={styles.middleSection}>
        <div style={styles.chartCard}>
          <div ref={chartRef} style={{ width: "100%", height: 360 }} />
        </div>

        <div style={styles.sideColumn}>
          {/* 发布日历 */}
          <div style={styles.sideCard}>
            <h3 style={styles.sideTitle}>📅 数据发布日历</h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {data.calendar.map((item, idx) => (
                <li key={idx} style={styles.calendarItem}>
                  <span style={styles.calendarDot(item.status)} />
                  <span style={{ flex: 1 }}>{item.name}</span>
                  <span style={styles.calendarStatus(item.status)}>{item.status}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 预警提示 */}
          <div style={styles.sideCard}>
            <h3 style={styles.sideTitle}>⚠️ 数据预警提示</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.indicators.ppi?.value && data.indicators.ppi.value > 2.5 && (
                <div style={styles.alertItem("warning")}>
                  PPI同比涨幅扩大至 {data.indicators.ppi.value}%，关注通胀传导风险
                </div>
              )}
              {data.indicators.pmi?.value && data.indicators.pmi.value < 50 && (
                <div style={styles.alertItem("warning")}>
                  制造业PMI低于荣枯线 ({data.indicators.pmi.value})，关注工业生产动能
                </div>
              )}
              {data.indicators.m2?.value && data.indicators.m2.value > 8 && (
                <div style={styles.alertItem("success")}>
                  M2-M1剪刀差收窄，资金活化程度改善
                </div>
              )}
              {data.indicators.fx_reserves?.value && (
                <div style={styles.alertItem("success")}>
                  外汇储备规模稳定 ({data.indicators.fx_reserves.value}万亿$)，国际收支基本平衡
                </div>
              )}
              {(!data.indicators.ppi?.value || data.indicators.ppi.value <= 2.5) &&
                (!data.indicators.pmi?.value || data.indicators.pmi.value >= 50) && (
                  <div style={styles.alertItem("success")}>当前宏观数据无重大异常预警</div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* 底部指标速览 */}
      <div style={styles.bottomCard}>
        <h3 style={styles.sideTitle}>🔍 关键指标速览</h3>
        <div style={styles.quickGrid}>
          {QUICK_INDICATORS.map((key) => {
            const indicator = data.indicators[key];
            if (!indicator) return null;
            return (
              <div key={key} style={styles.quickItem}>
                <div style={styles.quickName}>{indicator.name}</div>
                <div style={styles.quickValue}>
                  {formatValue(indicator.value, indicator.unit)}
                </div>
                <div style={{ fontSize: 12, color: "#999" }}>
                  {indicator.date || ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <footer style={{ textAlign: "center", padding: "24px 0", color: "#999", fontSize: 12 }}>
        数据来源：国家统计局、中国人民银行、国家外汇管理局 | 自动更新于每日 09:30
      </footer>
    </div>
  );
}

const styles: Record<string, any> = {
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "24px 16px",
  },
  loadingBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid #f0f0f0",
    borderTop: "3px solid #1890ff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
    background: "#fff",
    borderRadius: 12,
    padding: 24,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    color: "#1f1f1f",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#999",
  },
  refreshBtn: {
    padding: "8px 16px",
    borderRadius: 6,
    border: "1px solid #d9d9d9",
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.2s",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
    marginBottom: 20,
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    border: "1px solid #f0f0f0",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardName: {
    fontSize: 14,
    color: "#666",
  },
  cardDate: {
    fontSize: 12,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 700,
    color: "#1f1f1f",
    marginBottom: 8,
  },
  cardChange: {
    display: "flex",
    alignItems: "center",
  },
  changeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 500,
  },
  middleSection: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 16,
    marginBottom: 20,
  },
  chartCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    border: "1px solid #f0f0f0",
  },
  sideColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  sideCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    border: "1px solid #f0f0f0",
    flex: 1,
  },
  sideTitle: {
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 12,
    color: "#1f1f1f",
  },
  calendarItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 0",
    borderBottom: "1px solid #f5f5f5",
    fontSize: 13,
  },
  calendarDot: (status: string) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background:
      status === "已发布"
        ? "#52c41a"
        : status === "即将发布"
        ? "#faad14"
        : "#d9d9d9",
    flexShrink: 0,
  }),
  calendarStatus: (status: string) => ({
    fontSize: 12,
    padding: "2px 6px",
    borderRadius: 4,
    background:
      status === "已发布"
        ? "#f6ffed"
        : status === "即将发布"
        ? "#fffbe6"
        : "#f5f5f5",
    color:
      status === "已发布"
        ? "#389e0d"
        : status === "即将发布"
        ? "#d48806"
        : "#999",
  }),
  alertItem: (type: "warning" | "success") => ({
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 13,
    lineHeight: 1.5,
    background: type === "warning" ? "#fff2f0" : "#f6ffed",
    color: type === "warning" ? "#cf1322" : "#389e0d",
    border: `1px solid ${type === "warning" ? "#ffccc7" : "#b7eb8f"}`,
  }),
  bottomCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    border: "1px solid #f0f0f0",
    marginBottom: 20,
  },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 16,
  },
  quickItem: {
    textAlign: "center" as const,
    padding: 12,
    borderRadius: 8,
    background: "#fafafa",
  },
  quickName: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  quickValue: {
    fontSize: 20,
    fontWeight: 600,
    color: "#1f1f1f",
  },
};
