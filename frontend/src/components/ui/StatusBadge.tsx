import { cn } from "../../lib/cn";
import type { StatusTone } from "../../types/domain";

const toneClasses: Record<StatusTone, string> = {
  success: "bg-[#7bd66f]/12 text-[#a6f09d] ring-[#7bd66f]/28",
  warning: "bg-[#f0b84d]/12 text-[#ffd787] ring-[#f0b84d]/30",
  danger: "bg-[#ff6b5f]/12 text-[#ffaaa3] ring-[#ff6b5f]/30",
  neutral: "bg-white/8 text-[#bfd0cd] ring-white/12",
  accent: "bg-[#35d7c7]/12 text-[#8df0e5] ring-[#35d7c7]/30"
};

interface StatusBadgeProps {
  children: string;
  tone?: StatusTone;
  className?: string;
}

export function StatusBadge({ children, tone = "neutral", className }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", toneClasses[tone], className)}>
      {children}
    </span>
  );
}
