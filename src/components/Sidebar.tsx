import { NavLink } from "react-router-dom";

interface SidebarProps {
  onLogout: () => void;
}

const NAV_ITEMS = [
  { path: "/", label: "📊 宏观经济概览", exact: true },
  { path: "/gdp", label: "📈 GDP分析" },
  { path: "/cpi", label: "🛒 CPI分析" },
  { path: "/ppi", label: "🏭 PPI分析" },
  { path: "/pmi", label: "🔧 PMI分析" },
  { path: "/money", label: "💰 货币金融" },
  { path: "/trade", label: "🌐 贸易投资" },
  { path: "/consumption", label: "🛍️ 消费就业" },
  { path: "/foreign", label: "💵 外汇储备" },
  { path: "/industry", label: "⚡ 工业能源" },
  { path: "/realestate", label: "🏠 房地产" },
];

export default function Sidebar({ onLogout }: SidebarProps) {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoIcon}>📊</div>
        <div style={styles.logoText}>宏观经济数据平台</div>
      </div>

      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={styles.footer}>
        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>👤</div>
          <div style={styles.userName}>admin</div>
        </div>
        <button style={styles.logoutBtn} onClick={onLogout}>
          退出登录
        </button>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 220,
    minHeight: "100vh",
    background: "#001529",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
  },
  logo: {
    padding: "20px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoIcon: {
    fontSize: 24,
  },
  logoText: {
    fontSize: 15,
    fontWeight: 600,
    color: "#fff",
    whiteSpace: "nowrap",
  },
  nav: {
    flex: 1,
    padding: "12px 0",
    overflowY: "auto",
  },
  navItem: {
    display: "block",
    padding: "12px 20px",
    color: "rgba(255,255,255,0.65)",
    textDecoration: "none",
    fontSize: 14,
    transition: "all 0.2s",
    borderLeft: "3px solid transparent",
  },
  navItemActive: {
    color: "#fff",
    background: "#1890ff",
    borderLeftColor: "#40a9ff",
  },
  footer: {
    padding: "16px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  userAvatar: {
    fontSize: 20,
  },
  userName: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  logoutBtn: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 4,
    border: "1px solid rgba(255,255,255,0.3)",
    background: "transparent",
    color: "rgba(255,255,255,0.65)",
    cursor: "pointer",
    fontSize: 13,
    transition: "all 0.2s",
  },
};
