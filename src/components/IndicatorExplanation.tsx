import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

interface ExplainItem {
  label: string;
  content: string;
}

interface IndicatorExplanationProps {
  title: string;
  items: ExplainItem[];
}

export function IndicatorExplanation({ title, items }: IndicatorExplanationProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#f1f5f9] transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen size={15} className="text-[#2563eb]" />
          <span className="text-sm font-medium text-[#475569]">{title}</span>
        </div>
        {expanded ? <ChevronUp size={15} className="text-[#94a3b8]" /> : <ChevronDown size={15} className="text-[#94a3b8]" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#e2e8f0]">
          <div className="pt-3 space-y-2.5">
            {items.map((item, i) => (
              <div key={i}>
                <span className="text-xs font-semibold text-[#2563eb]">{item.label}</span>
                <p className="text-xs text-[#64748b] leading-relaxed mt-0.5">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
