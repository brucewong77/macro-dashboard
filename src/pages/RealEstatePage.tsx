import { useEffect, useState } from "react";
import { loadMacroData } from "../data/api";
import type { MacroData } from "../data/api";

export default function RealEstatePage() {
  const [data, setData] = useState<MacroData | null>(null);

  useEffect(() => {
    loadMacroData().then(setData);
  }, []);

  if (!data) return <div style={{ padding: 40, textAlign: "center" }}>加载中...</div>;

  return (
    <div>
      <div style={styles.descCard}>
        <h2 style={styles.descTitle}>房地产</h2>
        <p style={styles.descText}>房地产指标反映房地产市场运行状况，包括房价、成交量、开发投资等，是判断经济周期和金融风险的重要依据。</p>
      </div>
      <div style={{ padding: 40, textAlign: "center", color: "#999" }}>
        该模块数据正在完善中，敬请期待...
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
};
