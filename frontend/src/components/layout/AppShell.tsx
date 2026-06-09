import { useState } from "react";
import { ArrowRight, Bell, CheckCircle2, Clock3, CloudSun, Mountain, Settings, X } from "lucide-react";
import { navigationItems } from "../../data/navigation";
import { cn } from "../../lib/cn";
import { useConsoleStore } from "../../store/useConsoleStore";
import type { PageId } from "../../types/domain";

type UtilityItem = {
  key: string;
  icon: typeof CloudSun;
  label: string;
  title: string;
  detail: string;
  action: string;
  target: PageId;
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const activePage = useConsoleStore((state) => state.activePage);
  const setActivePage = useConsoleStore((state) => state.setActivePage);
  const [notice, setNotice] = useState("系统巡检正常");
  const [activeUtility, setActiveUtility] = useState<string | null>(null);
  const utilities: UtilityItem[] = [
    { key: "weather", icon: CloudSun, label: "18°C 多云", title: "现场天气", detail: "多云，体感舒适，适合维持常规导览节奏。", action: "聚焦空间态势", target: "overview" },
    { key: "alerts", icon: Bell, label: "8 条告警", title: "告警中心", detail: "设备告警、知识缺口和应急事件已汇总到内容治理台。", action: "查看告警", target: "content" },
    { key: "shift", icon: Clock3, label: "早班值守", title: "值守班次", detail: "早班运行中，刷新数据后可查看客流与工单趋势。", action: "查看数据中心", target: "data" },
    { key: "settings", icon: Settings, label: "设置", title: "系统设置", detail: "权限、内容口径和审计入口已预留到 OA 工作台。", action: "进入设置入口", target: "content" }
  ];
  const activeUtilityItem = utilities.find((item) => item.key === activeUtility);

  const triggerShellAction = (key: string, label: string) => {
    setActiveUtility((current) => (current === key ? null : key));
    setNotice(`${label} 面板已打开`);
  };

  const runUtilityAction = () => {
    if (!activeUtilityItem) return;
    setActivePage(activeUtilityItem.target);
    setNotice(`${activeUtilityItem.action}已执行`);
    setActiveUtility(null);
  };

  return (
    <div className="min-h-screen bg-[#f7f8f6] text-[#1f2928]">
      <header className="sticky top-0 z-40 border-b border-[#dfe5e1] bg-white/96 px-4 py-2 shadow-[0_10px_30px_rgba(20,35,32,.07)] backdrop-blur-2xl lg:px-8">
        <div className="mx-auto grid max-w-[1960px] gap-3 xl:grid-cols-[minmax(330px,.72fr)_minmax(620px,1.28fr)_auto] xl:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-[#d29b35] bg-[#fffaf0] text-[#d29b35]">
              <Mountain size={28} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <strong className="block truncate text-lg font-black tracking-tight text-[#1f2928] sm:text-xl">灵山景区 AI 数字人运营平台</strong>
              <span className="block truncate text-sm font-medium text-[#8b9693]">Spatial Operations Suite - 空间化运营套件</span>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="一级页面">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activePage;
              return (
                <button
                  className={cn(
                    "group flex min-h-10 min-w-0 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition duration-200 active:translate-y-px",
                    isActive
                      ? "bg-[#0f6857] text-white shadow-[0_14px_28px_rgba(15,104,87,0.22)]"
                      : "border border-[#dfe5e1] bg-[#f7f8f6] text-[#53615e] hover:border-[#0f6857]/20 hover:bg-[#ecf2ef]"
                  )}
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setActiveUtility(null);
                  }}
                  type="button"
                >
                  <Icon size={18} />
                  <span className="grid min-w-0 gap-0.5">
                    <span className="truncate font-semibold">{item.label}</span>
                    <span className={cn("hidden truncate text-xs sm:block", isActive ? "text-white/72" : "text-[#8b9693]")}>{item.description}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="flex flex-wrap items-center justify-start gap-2 text-[#64716e] xl:justify-end">
            {utilities.map(({ key, icon: Icon, label }) => (
              <button
                aria-expanded={activeUtility === key}
                aria-label={label}
                className={cn(
                  "inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm transition hover:bg-[#eef3f0] active:translate-y-px",
                  activeUtility === key ? "border-[#0f6857]/30 bg-[#0f6857]/8 text-[#0f6857]" : "border-[#dfe5e1] bg-white"
                )}
                key={key}
                onClick={() => triggerShellAction(key, label)}
                type="button"
              >
                <Icon size={17} />
                <span className="hidden 2xl:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-1 max-w-[1960px] text-xs font-medium text-[#7a8582]">{notice}</div>

        {activeUtilityItem && (
          <section className="absolute right-4 top-[calc(100%-4px)] z-50 w-[min(360px,calc(100vw-32px))] rounded-2xl border border-[#dfe5e1] bg-white/96 p-4 text-left shadow-2xl shadow-black/10 backdrop-blur-2xl lg:right-8">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="mb-2 inline-flex min-h-7 items-center gap-2 rounded-full border border-[#0f6857]/20 bg-[#0f6857]/10 px-3 text-xs font-semibold text-[#0f6857]">
                  <CheckCircle2 size={14} /> 系统托盘
                </div>
                <h2 className="text-base font-bold text-[#1f2928]">{activeUtilityItem.title}</h2>
              </div>
              <button
                aria-label="关闭系统托盘"
                className="grid min-h-9 min-w-9 place-items-center rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] text-[#53615e] transition hover:bg-[#eef3f0] active:translate-y-px"
                onClick={() => setActiveUtility(null)}
                type="button"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm leading-6 text-[#71807d]">{activeUtilityItem.detail}</p>
            <button
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0f6857] px-3 text-sm font-semibold text-white transition hover:bg-[#1d4e43] active:translate-y-px"
              onClick={runUtilityAction}
              type="button"
            >
              {activeUtilityItem.action} <ArrowRight size={15} />
            </button>
          </section>
        )}
      </header>

      <main className="mx-auto max-w-[1960px] px-4 py-4 lg:px-8">{children}</main>
    </div>
  );
}
