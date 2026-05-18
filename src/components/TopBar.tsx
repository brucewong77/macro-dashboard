import { useLocation } from "react-router-dom";

const PAGE_TITLES: Record<string, string> = {
  "/": "宏观经济概览",
  "/gdp": "GDP分析",
  "/cpi": "CPI分析",
  "/ppi": "PPI分析",
  "/pmi": "PMI分析",
  "/money": "货币金融",
  "/trade": "贸易投资",
  "/consumption": "消费就业",
  "/foreign": "外汇储备",
  "/industry": "工业能源",
  "/realestate": "房地产",
};

export default function TopBar() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || "宏观经济数据平台";

  return (
    <header style={styles.header}>
      <h1 style={styles.title}>{title}</h1>
      <div style={styles.breadcrumb}>
        首页 / {title}
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    background: "#fff",
    padding: "16px 24px",
    borderBottom: "1px solid #f0f0f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: "#1f1f1f",
    margin: 0,
  },
  breadcrumb: {
    fontSize: 13,
    color: "#999",
  },
};
