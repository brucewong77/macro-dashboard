import { useApp } from '../App';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

export function TopBar() {
  const { activeModule } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const moduleNameMap: Record<string, string> = {
    'overview': '数据概览',
    'ppi': 'PPI',
    'cpi': 'CPI',
    'pmi-mfg': '制造业PMI',
    'pmi-nonmfg': '非制造业PMI和财新PMI',
    'industrial': '工业增加值',
    'electricity': '社会用电量',
    'fx-reserve': '外汇储备',
    'export': '出口',
    'import': '进口',
    'retail': '社零增加值',
    'income': '居民可支配收入',
    'unemployment': '城镇失业率',
    'fai': '固定投资增速',
    'realestate': '地产数据',
    'social-financing': '社融',
    'credit': '信贷',
    'policy-rate': '政策利率',
    'money-supply': '资金活力',
    'deposit': '存款',
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <header className="flex items-center justify-between h-14 px-5 bg-white border-b border-[#e2e8f0] shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-[#1e293b]">
          {moduleNameMap[activeModule] || '数据概览'}
        </h1>
        <span className="text-xs text-[#94a3b8] bg-[#f1f5f9] px-2 py-0.5 rounded-full">
          2010.01 - 2026.03
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#e2e8f0] text-[#475569] hover:text-[#2563eb] hover:border-[#2563eb] transition-colors text-sm"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>刷新数据</span>
        </button>
      </div>
    </header>
  );
}
