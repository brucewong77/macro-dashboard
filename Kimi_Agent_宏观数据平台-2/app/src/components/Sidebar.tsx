import { useState } from 'react';
import { useApp, navItems } from '../App';
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function Sidebar() {
  const { activeModule, setActiveModule, sidebarCollapsed, setSidebarCollapsed } = useApp();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    price: false,
    production: false,
    trade: false,
    consumption: false,
    investment: false,
    finance: false,
    liquidity: false,
  });

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleClick = (id: string, hasChildren?: boolean) => {
    if (hasChildren) {
      toggleGroup(id);
    } else {
      setActiveModule(id);
    }
  };

  const isActive = (id: string) => activeModule === id;

  return (
    <aside
      className="flex flex-col bg-white border-r border-[#e2e8f0] transition-all duration-300 ease-in-out relative shadow-sm"
      style={{ width: sidebarCollapsed ? 64 : 240 }}
    >
      {/* Header */}
      <div className="flex items-center h-14 px-3 border-b border-[#e2e8f0] shrink-0">
        {!sidebarCollapsed && (
          <>
            <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">宏</span>
            </div>
            <span className="font-semibold text-sm text-[#1e293b] truncate">宏观经济数据平台</span>
          </>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">宏</span>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:text-[#1e293b] hover:border-[#cbd5e1] z-10 shadow-sm"
      >
        {sidebarCollapsed ? <PanelLeftOpen size={12} /> : <PanelLeftClose size={12} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'thin' }}>
        {navItems.map(item => (
          <div key={item.id}>
            <button
              onClick={() => handleClick(item.id, !!item.children)}
              className={`w-full flex items-center h-10 px-3 text-sm transition-colors relative ${
                isActive(item.id) && !item.children
                  ? 'bg-[#eff6ff] text-[#2563eb]'
                  : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#1e293b]'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {isActive(item.id) && !item.children && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#2563eb] rounded-r" />
              )}
              {item.icon && <item.icon size={18} className="shrink-0" />}
              {!sidebarCollapsed && (
                <>
                  <span className="ml-3 truncate font-medium">{item.label}</span>
                  {item.children && (
                    <ChevronRight
                      size={14}
                      className={`ml-auto text-[#94a3b8] transition-transform ${
                        expandedGroups[item.id] ? 'rotate-90' : ''
                      }`}
                    />
                  )}
                </>
              )}
            </button>

            {!sidebarCollapsed && item.children && expandedGroups[item.id] && (
              <div className="ml-0">
                {item.children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => setActiveModule(child.id)}
                    className={`w-full flex items-center h-9 pl-9 pr-3 text-[13px] transition-colors relative ${
                      isActive(child.id)
                        ? 'bg-[#eff6ff] text-[#2563eb]'
                        : 'text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]'
                    }`}
                  >
                    {isActive(child.id) && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#2563eb] rounded-r" />
                    )}
                    <span className="truncate">{child.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
