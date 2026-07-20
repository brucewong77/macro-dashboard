import type { ReactNode } from 'react';
import { Download } from 'lucide-react';
import { MonthPicker } from './MonthPicker';

interface Preset {
  label: string;
  sy: number; sm: number; ey: number; em: number;
}

interface DateRange {
  startStr: string; endStr: string;
  presets: Preset[];
  isPresetActive: (label: string) => boolean;
  applyPreset: (label: string) => void;
  setStartStr: (v: string) => void;
  setEndStr: (v: string) => void;
}

interface ChartCardProps {
  title: ReactNode;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  dateRange?: DateRange;
}

export function ChartCard({ title, subtitle, children, className = '', dateRange }: ChartCardProps) {
  return (
    <div className={`bg-white border border-[#e2e8f0] rounded-lg overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all ${className}`}>
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#f1f5f9]">
        <div>
          <h3 className="text-sm font-semibold text-[#1e293b]">{title}</h3>
          {subtitle && <p className="text-xs text-[#94a3b8] mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {/* 日历时间选择器 */}
          {dateRange && (
            <div className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-md px-2 py-1">
              <MonthPicker
                value={dateRange.startStr}
                onChange={dateRange.setStartStr}
              />
              <span className="text-[#94a3b8] text-[10px]">~</span>
              <MonthPicker
                value={dateRange.endStr}
                onChange={dateRange.setEndStr}
              />
            </div>
          )}
          {/* 快捷按钮 */}
          {dateRange && (
            <div className="flex items-center gap-0.5">
              {dateRange.presets.map(p => (
                <button
                  key={p.label}
                  onClick={() => dateRange.applyPreset(p.label)}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                    dateRange.isPresetActive(p.label)
                      ? 'bg-[#2563eb] text-white'
                      : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
          {/* 下载按钮 */}
          <button className="text-[#94a3b8] hover:text-[#2563eb] transition-colors p-1 rounded hover:bg-[#f1f5f9]">
            <Download size={14} />
          </button>
        </div>
      </div>
      {/* Chart content */}
      <div className="p-4">{children}</div>
    </div>
  );
}
