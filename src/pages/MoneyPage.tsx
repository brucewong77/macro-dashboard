import { useEffect, useState } from "react";
import { loadMacroData, formatValue } from "../data/api";
import type { MacroData } from "../data/api";

const MONEY_KEYS = [
  { key: "m2", name: "M2同比增速", desc: "广义货币供应量增速，反映社会总需求变化" },
  { key: "lpr", name: "LPR(1年)", desc: "贷款市场报价利率，反映市场利率水平" },
  { key: "shrzgm", name: "社融存量增速", desc: "社会融资规模存量增速，反映实体经济融资需求" },
];

export default function MoneyPage() {
  const [data, setData] = useState<MacroData | null>(null);

  useEffect(() => {
    loadMacroData().then(setData);
  }, []);

  if (!data) return <div style={{ padding: 40, textAlign: "center" }}>加载中...</div>;

  return (
    <div>
      <div style={styles.descCard}>
        <h2 style={styles.descTitle}>货币金融</h2>
        <p style={styles.descText}>货币金融指标反映货币供应量、利率水平和社会融资状况，是判断货币政策松紧程度的重要依据。</p>
      </div>
      <div style={styles.grid}>
        {MONEY_KEYS.map((item) => {
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
