import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { clearAuth } from "../utils/auth";

export default function MainLayout() {
  const handleLogout = () => {
    clearAuth();
    window.location.reload();
  };

  return (
    <div style={styles.wrapper}>
      <Sidebar onLogout={handleLogout} />
      <div style={styles.main}>
        <TopBar />
        <div style={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    background: "#f0f2f5",
  },
  main: {
    flex: 1,
    marginLeft: 220,
    display: "flex",
    flexDirection: "column",
  },
  content: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
  },
};
