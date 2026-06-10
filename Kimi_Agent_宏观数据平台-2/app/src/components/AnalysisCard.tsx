interface AnalysisCardProps {
  title: string;
  content: string;
  updateTime?: string;
}

export function AnalysisCard({ title, content, updateTime }: AnalysisCardProps) {
  return (
    <div className="w-full bg-white border border-[#e2e8f0] rounded-lg p-5 relative overflow-hidden hover:border-[#cbd5e1] hover:shadow-md transition-all">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2563eb] rounded-l-lg" />
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-[#1e293b] flex items-center gap-2">
          <span className="text-[#2563eb]">📊</span>
          {title}
        </h3>
        {updateTime && (
          <span className="text-xs text-[#94a3b8]">更新时间: {updateTime}</span>
        )}
      </div>
      <p className="text-sm text-[#475569] leading-relaxed">{content}</p>
    </div>
  );
}
