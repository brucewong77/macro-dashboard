import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useCallback } from "react";
import Login from "./components/Login";
import MainLayout from "./layouts/MainLayout";
import OverviewPage from "./pages/OverviewPage";
import GDPPage from "./pages/GDPPage";
import CPIPage from "./pages/CPIPage";
import PPIPage from "./pages/PPIPage";
import PMIPage from "./pages/PMIPage";
import MoneyPage from "./pages/MoneyPage";
import TradePage from "./pages/TradePage";
import ConsumptionPage from "./pages/ConsumptionPage";
import ForeignPage from "./pages/ForeignPage";
import IndustryPage from "./pages/IndustryPage";
import RealEstatePage from "./pages/RealEstatePage";
import { isAuthenticated } from "./utils/auth";

function App() {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated);

  const handleLogin = useCallback(() => {
    setLoggedIn(true);
  }, []);

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="gdp" element={<GDPPage />} />
          <Route path="cpi" element={<CPIPage />} />
          <Route path="ppi" element={<PPIPage />} />
          <Route path="pmi" element={<PMIPage />} />
          <Route path="money" element={<MoneyPage />} />
          <Route path="trade" element={<TradePage />} />
          <Route path="consumption" element={<ConsumptionPage />} />
          <Route path="foreign" element={<ForeignPage />} />
          <Route path="industry" element={<IndustryPage />} />
          <Route path="realestate" element={<RealEstatePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
