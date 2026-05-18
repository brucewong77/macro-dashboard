import { useEffect, useState } from "react";
import { loadMacroData, formatValue } from "../data/api";
import type { MacroData } from "../data/api";

const CONSUMPTION_KEYS = [
  { key: "retail_sales", name: "社零同比", desc: "社会消费品零售总额同比增速，反映消费需求" },
  { key: "unemployment", name: "失业率", desc: "城镇调查失业率，反映就业市场状况" },
];

export default function ConsumptionPage() {
  const [data, setData] = useState<MacroData | null>(null);

  useEffect(() => {
    loadMacroData().then(setData);
  }, []);

  if (!data) return <div style={{ padding: 40, textAlign: "center" }}>加载中...</div>;

  return (
    <div>
      <div style={styles.descCard}>
        <h2 style={styles.descTitle}>消费就业</h2>
        <p style={styles.descText}>消费就业指标反映居民消费状况和就业市场变化，是判断内需和民生状况的重要依据。</p>
      </div>
      <div style={styles.grid}>
        {CONSUMPTION_KEYS.map((item) => {
          const indicator = data.indicators[item.key];
          if (!indicator) return null;
          return (
            <div key={item.key} style={styles.card}>
              <div style={styles.cardName}>{item.name}</div>
              <div style={styles.cardValue}>{formatValue(indicator.value, indicator.unit)}</div>
              <div style={styles.cardDesc}>{item.desc}</div>
              <div style={styles.cardDate}>{indicator.date}</div>
            </div>
          );
        })}
      </div>
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
  descTitle: { fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#1f1f1f" },
  descText: { fontSize: 14, color: "#666", lineHeight: 1.6 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 16,
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    border: "1px solid #f0f0f0",
  },
  cardName: { fontSize: 14, color: "#666", marginBottom: 8 },
  cardValue: { fontSize: 28, fontWeight: 700, color: "#1f1f1f", marginBottom: 8 },
  cardDesc: { fontSize: 13, color: "#999", marginBottom: 8, lineHeight: 1.5 },
  cardDate: { fontSize: 12, color: "#bbb" },
};
