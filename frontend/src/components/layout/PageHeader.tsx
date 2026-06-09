import type { ReactNode } from "react";

interface PageHeaderProps {
  index?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  tone?: "light" | "dark";
}

export function PageHeader({ title, description, actions, tone = "light" }: PageHeaderProps) {
  const dark = tone === "dark";
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-1 h-8 w-1.5 shrink-0 rounded-full bg-[#0f6857] shadow-[0_12px_28px_rgba(15,104,87,0.18)]" aria-hidden="true" />
        <div className="min-w-0">
          <h1 className={`text-2xl font-bold tracking-tight ${dark ? "text-[#eef8f6]" : "text-[#1f2928]"}`}>{title}</h1>
          <p className={`mt-1 max-w-3xl break-words text-sm leading-6 ${dark ? "text-[#9fb8b4]" : "text-[#71807d]"}`}>{description}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
