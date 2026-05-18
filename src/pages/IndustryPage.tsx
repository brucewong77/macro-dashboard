import { useEffect, useState } from "react";
import { loadMacroData } from "../data/api";
import type { MacroData } from "../data/api";

export default function IndustryPage() {
  const [data, setData] = useState<MacroData | null>(null);

  useEffect(() => {
    loadMacroData().then(setData);
  }, []);

  if (!data) return <div style={{ padding: 40, textAlign: "center" }}>加载中...</div>;

  return (
    <div>
      <div style={styles.descCard}>
        <h2 style={styles.descTitle}>工业能源</h2>
        <p style={styles.descText}>工业能源指标反映工业生产活动和能源消费状况，是判断实体经济运行状况的重要依据。</p>
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
