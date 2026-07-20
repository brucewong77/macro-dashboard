import { useState, useCallback, createContext, useContext, lazy, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { OverviewModule } from './modules/OverviewModule';
import { GDPModule } from './modules/GDPModule';
import { LayoutDashboard, BarChart3, TrendingUp, Factory, Ship, ShoppingCart, HardHat, Landmark, Droplets } from 'lucide-react';

// 懒加载各模块 - 按需加载，减少首屏JS体积
// OverviewModule 直接导入（文字/KPI卡片立即渲染），只有其中的图表部分懒加载
const PPIModule = lazy(() => import('./modules/PPIModule'));
const CPIModule = lazy(() => import('./modules/CPIModule'));
const PMIManufacturingModule = lazy(() => import('./modules/PMIManufacturingModule'));
const PMINonManufacturingModule = lazy(() => import('./modules/PMINonManufacturingModule'));
const IndustrialModule = lazy(() => import('./modules/IndustrialModule'));
const ElectricityModule = lazy(() => import('./modules/ElectricityModule'));
const FXReserveModule = lazy(() => import('./modules/FXReserveModule'));
const ExportModule = lazy(() => import('./modules/ExportModule'));
const ImportModule = lazy(() => import('./modules/ImportModule'));
const RetailModule = lazy(() => import('./modules/RetailModule'));
const IncomeModule = lazy(() => import('./modules/IncomeModule'));
const FAIModule = lazy(() => import('./modules/FAIModule'));
const RealEstateModule = lazy(() => import('./modules/RealEstateModule'));
const SocialFinancingModule = lazy(() => import('./modules/SocialFinancingModule'));
const CreditModule = lazy(() => import('./modules/CreditModule'));
const PolicyRateModule = lazy(() => import('./modules/PolicyRateModule'));
const MoneySupplyModule = lazy(() => import('./modules/MoneySupplyModule'));
const DepositModule = lazy(() => import('./modules/DepositModule'));

export interface NavItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  { id: 'overview', label: '数据概览', icon: LayoutDashboard },
  { id: 'gdp', label: 'GDP', icon: BarChart3 },
  {
    id: 'price', label: '价格指标', icon: TrendingUp,
    children: [
      { id: 'ppi', label: 'PPI' },
      { id: 'cpi', label: 'CPI' },
    ],
  },
  {
    id: 'production', label: '生产指标', icon: Factory,
    children: [
      { id: 'pmi-mfg', label: '制造业PMI' },
      { id: 'pmi-nonmfg', label: '非制造业PMI' },
      { id: 'industrial', label: '工业增加值' },
      { id: 'electricity', label: '社会用电量' },
    ],
  },
  {
    id: 'trade', label: '进出口指标', icon: Ship,
    children: [
      { id: 'fx-reserve', label: '外汇储备' },
      { id: 'export', label: '出口' },
      { id: 'import', label: '进口' },
    ],
  },
  {
    id: 'consumption', label: '消费指标', icon: ShoppingCart,
    children: [
      { id: 'retail', label: '社零情况' },
      { id: 'income', label: '居民可支配收入' },
    ],
  },
  {
    id: 'investment', label: '投资指标', icon: HardHat,
    children: [
      { id: 'fai', label: '固定投资增速' },
      { id: 'realestate', label: '地产数据' },
    ],
  },
  {
    id: 'finance', label: '金融指标', icon: Landmark,
    children: [
      { id: 'social-financing', label: '社融' },
      { id: 'credit', label: '存款和杠杆' },
    ],
  },
  {
    id: 'liquidity', label: '流动性指标', icon: Droplets,
    children: [
      { id: 'policy-rate', label: '政策利率' },
      { id: 'money-supply', label: '资金活力' },
    ],
  },
];

// 全局可用的月份列表（2010-01 到 2026-06）
export const ALL_MONTHS: string[] = [];
for (let y = 2010; y <= 2026; y++) {
  const sm = y === 2010 ? 1 : 1;
  const em = y === 2026 ? 6 : 12;
  for (let m = sm; m <= em; m++) {
    ALL_MONTHS.push(`${y}-${String(m).padStart(2, '0')}`);
  }
}

interface AppContextType {
  activeModule: string;
  setActiveModule: (id: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

const AppContext = createContext<AppContextType>({
  activeModule: 'overview',
  setActiveModule: () => {},
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
});

export const useApp = () => useContext(AppContext);

// 加载中骨架屏
function ModuleSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 bg-[#e2e8f0] rounded-lg" />
      <div className="h-80 bg-[#e2e8f0] rounded-lg" />
      <div className="h-80 bg-[#e2e8f0] rounded-lg" />
    </div>
  );
}

function App() {
  const [activeModule, setActiveModule] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSetModule = useCallback((id: string) => {
    setActiveModule(id);
  }, []);

  const renderModule = () => {
    switch (activeModule) {
      case 'overview': return <OverviewModule />;
      case 'gdp': return <GDPModule />;
      case 'ppi': return <PPIModule />;
      case 'cpi': return <CPIModule />;
      case 'pmi-mfg': return <PMIManufacturingModule />;
      case 'pmi-nonmfg': return <PMINonManufacturingModule />;
      case 'industrial': return <IndustrialModule />;
      case 'electricity': return <ElectricityModule />;
      case 'fx-reserve': return <FXReserveModule />;
      case 'export': return <ExportModule />;
      case 'import': return <ImportModule />;
      case 'retail': return <RetailModule />;
      case 'income': return <IncomeModule />;
      case 'fai': return <FAIModule />;
      case 'realestate': return <RealEstateModule />;
      case 'social-financing': return <SocialFinancingModule />;
      case 'credit': return <DepositModule />;
      case 'policy-rate': return <PolicyRateModule />;
      case 'money-supply': return <MoneySupplyModule />;
      default: return <OverviewModule />;
    }
  };

  return (
    <AppContext.Provider value={{
      activeModule,
      setActiveModule: handleSetModule,
      sidebarCollapsed,
      setSidebarCollapsed,
    }}>
      <div className="flex h-screen w-full bg-[#f8fafc] text-[#1e293b] overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-4">
            {/* OverviewModule 直接渲染（文字/KPI卡片立即可见，只有图表懒加载）
                其他模块通过 Suspense 懒加载 */}
            {activeModule === 'overview' ? (
              <OverviewModule />
            ) : (
              <Suspense fallback={<ModuleSkeleton />}>
                {renderModule()}
              </Suspense>
            )}
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}

export default App;
