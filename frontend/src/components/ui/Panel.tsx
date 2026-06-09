import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface PanelProps {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}

export function Panel({ children, className, dark = false }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-xl border p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl",
        dark
          ? "border-white/10 bg-[#0d1b1e]/86 text-[#eef8f6] shadow-none"
          : "border-[#dfe5e1] bg-white/82 text-[#26302e] shadow-[0_18px_42px_rgba(20,35,32,0.08)]",
        className
      )}
    >
      {children}
    </section>
  );
}
