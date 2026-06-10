import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Calendar } from 'lucide-react';

interface MonthPickerProps {
  value: string;       // 格式: "2026-03"
  onChange: (v: string) => void;
  minYear?: number;
  maxYear?: number;
}

const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

export function MonthPicker({ value, onChange, minYear = 2010, maxYear = 2026 }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(2026);
  const ref = useRef<HTMLDivElement>(null);

  // Parse current value
  const [curYear, curMonth] = useMemo(() => {
    const parts = value.split('-');
    return [Number(parts[0]) || 2026, Number(parts[1]) || 3];
  }, [value]);

  // Sync view when opened
  useEffect(() => {
    if (open) {
      setViewYear(curYear);
    }
  }, [open, curYear]);

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  const handlePrevYear = useCallback(() => {
    setViewYear(y => Math.max(y - 1, minYear));
  }, [minYear]);

  const handleNextYear = useCallback(() => {
    setViewYear(y => Math.min(y + 1, maxYear));
  }, [maxYear]);

  const handleSelectMonth = useCallback((month: number) => {
    const monthStr = String(month).padStart(2, '0');
    onChange(`${viewYear}-${monthStr}`);
    setOpen(false);
  }, [viewYear, onChange]);

  return (
    <div className="relative" ref={ref}>
      {/* Input trigger */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 border rounded-md px-2.5 py-1 text-[12px] transition-colors ${
          open
            ? 'border-[#2563eb] ring-1 ring-[#2563eb]/20 bg-white'
            : 'border-[#e2e8f0] bg-[#f8fafc] hover:border-[#cbd5e1] hover:bg-white'
        }`}
      >
        <span className="text-[#1e293b] tabular-nums min-w-[56px] text-left">{value}</span>
        <Calendar size={13} className="text-[#94a3b8]" />
      </button>

      {/* Year-Month picker popup */}
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg z-50 w-[200px] p-3">
          {/* Year navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handlePrevYear}
              disabled={viewYear <= minYear}
              className="text-[#94a3b8] hover:text-[#1e293b] disabled:text-[#e2e8f0] text-sm px-2 py-0.5 transition-colors"
            >
              &lt;
            </button>
            <span className="text-[14px] font-semibold text-[#1e293b] tabular-nums">{viewYear}年</span>
            <button
              onClick={handleNextYear}
              disabled={viewYear >= maxYear}
              className="text-[#94a3b8] hover:text-[#1e293b] disabled:text-[#e2e8f0] text-sm px-2 py-0.5 transition-colors"
            >
              &gt;
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {MONTH_NAMES.map((name, i) => {
              const month = i + 1;
              const isSelected = viewYear === curYear && month === curMonth;
              return (
                <button
                  key={month}
                  onClick={() => handleSelectMonth(month)}
                  className={`h-8 rounded text-[12px] flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-[#2563eb] text-white font-medium'
                      : 'text-[#475569] hover:bg-[#f1f5f9]'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-2 pt-2 border-t border-[#f1f5f9] flex items-center justify-between">
            <button
              onClick={() => {
                const now = new Date();
                const y = now.getFullYear();
                const m = now.getMonth() + 1;
                onChange(`${y}-${String(m).padStart(2, '0')}`);
                setOpen(false);
              }}
              className="text-[11px] text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
            >
              本月
            </button>
            <button
              onClick={() => {
                onChange(`${minYear}-01`);
                setOpen(false);
              }}
              className="text-[11px] text-[#64748b] hover:text-[#1e293b] transition-colors"
            >
              最早
            </button>
            <button
              onClick={() => {
                onChange(`${maxYear}-03`);
                setOpen(false);
              }}
              className="text-[11px] text-[#64748b] hover:text-[#1e293b] transition-colors"
            >
              最新
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
