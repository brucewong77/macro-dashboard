// 鼠标悬停显示万得 Wind 指标 ID 的工具提示组件
import { useRef, useState } from 'react';

interface Props {
  /** Wind 指标 ID */
  id: string;
  /** Wind 指标名称（可选，会作为 tooltip 副标题） */
  windName?: string;
  children: React.ReactNode;
}

export function WindIdHover({ id, windName, children }: Props) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const elRef = useRef<HTMLSpanElement>(null);

  function handleMouseEnter() {
    timerRef.current = setTimeout(() => {
      const el = elRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPos({ x: rect.right + 6, y: rect.top });
      setShow(true);
    }, 400);
  }

  function handleMouseLeave() {
    clearTimeout(timerRef.current);
    setShow(false);
  }

  return (
    <span
      ref={elRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative cursor-help"
      style={{ borderBottom: '1px dashed #94a3b8' }}
    >
      {children}
      {show && (
        <span
          className="fixed z-[9999] pointer-events-none"
          style={{ left: pos.x, top: pos.y }}
        >
          <span className="inline-block bg-[#1e293b] text-white text-[10px] leading-tight rounded-md px-2.5 py-1.5 shadow-lg whitespace-nowrap">
            <span className="font-mono font-bold">{id}</span>
            {windName && (
              <span className="block text-[#94a3b8] font-normal mt-0.5 max-w-[260px] truncate">
                {windName}
              </span>
            )}
          </span>
        </span>
      )}
    </span>
  );
}
