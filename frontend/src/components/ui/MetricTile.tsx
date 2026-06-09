import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import type { MetricItem } from "../../types/domain";

interface MetricTileProps {
  metric: MetricItem;
  icon?: LucideIcon;
  dark?: boolean;
  className?: string;
}

const toneText = {
  success: "text-[#7bd66f]",
  warning: "text-[#f0b84d]",
  danger: "text-[#ff6b5f]",
  neutral: "text-[#9fb8b4]",
  accent: "text-[#35d7c7]"
};

export function MetricTile({ metric, icon: Icon, dark = false, className }: MetricTileProps) {
  return (
    <article
      className={cn(
        "rounded-xl border p-4",
        dark ? "border-white/10 bg-white/[0.045]" : "border-white/10 bg-white/[0.055]",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-[#9fb8b4]">
        {Icon && <Icon size={17} className={cn(metric.tone && toneText[metric.tone])} />}
        <span>{metric.label}</span>
      </div>
      <strong className="mt-3 block text-2xl font-bold tracking-tight text-[#eef8f6]">
        {metric.value}
      </strong>
      <small className={cn("mt-1 block text-xs", metric.tone ? toneText[metric.tone] : "text-[#9fb8b4]")}>
        {metric.note}
      </small>
    </article>
  );
}
