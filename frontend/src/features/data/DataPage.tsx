import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { gsap } from "gsap";
import { CheckCircle2, Clock3, Download, Eye, RefreshCw, SlidersHorizontal, TriangleAlert, X } from "lucide-react";
import { AnimatedSection } from "../../components/motion/AnimatedSection";
import { PageHeader } from "../../components/layout/PageHeader";
import { MetricTile } from "../../components/ui/MetricTile";
import { Panel } from "../../components/ui/Panel";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useAdminData } from "../../hooks/useAdminData";
import { BarChart } from "./components/BarChart";
import { DonutChart } from "./components/DonutChart";
import { LineChart } from "./components/LineChart";
import { RadarChart } from "./components/RadarChart";

function isGapRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && "id" in value;
}

const timeWindows = ["实时", "今日", "7日"] as const;
const refreshCadences = ["15s", "30s", "60s"] as const;

export function DataPage() {
  const { snapshot, connected, loading, updatedAt, busyAction, lastAction, actions } = useAdminData();
  const [timeWindow, setTimeWindow] = useState<(typeof timeWindows)[number]>("今日");
  const [refreshCadence, setRefreshCadence] = useState<(typeof refreshCadences)[number]>("30s");
  const [activeTrendIndex, setActiveTrendIndex] = useState(Math.max(snapshot.queueTrend.length - 1, 0));
  const [gapDrawerOpen, setGapDrawerOpen] = useState(false);
  const [draftGapId, setDraftGapId] = useState("");
  const [gapError, setGapError] = useState("");
  const gapDrawerRef = useRef<HTMLDivElement>(null);
  const refreshKey = updatedAt?.getTime() ?? 0;
  const trendData = useMemo(() => {
    if (timeWindow === "实时") return snapshot.queueTrend.slice(-4);
    if (timeWindow === "7日") {
      return snapshot.queueTrend.map((point, index) => ({
        label: point.label,
        value: Math.round((point.value + (snapshot.workOrderTrend[index]?.value ?? point.value)) / 2)
      }));
    }
    return snapshot.queueTrend;
  }, [snapshot.queueTrend, snapshot.workOrderTrend, timeWindow]);
  const activeTrend = trendData[Math.min(activeTrendIndex, trendData.length - 1)] ?? trendData[0];
  const pendingGaps = useMemo(
    () => (snapshot.dataGaps ?? []).filter((item): item is Record<string, unknown> => isGapRecord(item) && item.status !== "resolved"),
    [snapshot.dataGaps]
  );
  const selectedGap = pendingGaps.find((item) => item.id === draftGapId);

  useEffect(() => {
    setActiveTrendIndex((index) => Math.min(index, Math.max(trendData.length - 1, 0)));
  }, [trendData.length]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(".data-scan-line", { xPercent: -120, opacity: 0 }, { xPercent: 320, opacity: 1, duration: 0.9, ease: "power2.out" });
    gsap.fromTo(".data-kpi-card", { y: 8, filter: "brightness(1.28)" }, { y: 0, filter: "brightness(1)", duration: 0.42, stagger: 0.035, ease: "power3.out" });
    gsap.fromTo(".data-bar-fill", { scaleX: 0.18, transformOrigin: "left center" }, { scaleX: 1, duration: 0.62, stagger: 0.045, ease: "power3.out" });
    gsap.fromTo(".data-chart-panel", { y: 10, borderColor: "rgba(53,215,199,.36)" }, { y: 0, borderColor: "rgba(255,255,255,.10)", duration: 0.48, stagger: 0.05, ease: "power3.out" });
  }, [refreshKey]);

  useEffect(() => {
    if (!gapDrawerOpen || !gapDrawerRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(gapDrawerRef.current, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.26, ease: "power3.out" });
  }, [gapDrawerOpen]);

  function openGapDrawer() {
    setDraftGapId(String(pendingGaps[0]?.id ?? "GAP-001"));
    setGapError("");
    setGapDrawerOpen(true);
  }

  async function submitGap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draftGapId.trim()) {
      setGapError("请选择要标记处理的知识缺口。");
      return;
    }
    const ok = await actions.resolveDataGap(draftGapId.trim());
    if (ok) setGapDrawerOpen(false);
  }

  return (
    <AnimatedSection className="relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(53,215,199,.13),transparent_28rem),linear-gradient(180deg,#0a191b,#071112)] px-4 py-5 text-white shadow-[0_30px_100px_rgba(0,0,0,.28)] lg:px-8">
      <div className="data-scan-line pointer-events-none absolute left-0 top-0 h-px w-1/3 bg-[linear-gradient(90deg,transparent,#35d7c7,transparent)] opacity-0" />
      <PageHeader
        index="03"
        title="数据研判"
        tone="dark"
        description="围绕实时客流、数字人服务质量、知识命中率和内容缺口构建扫描式运营大屏。"
        actions={
          <>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-3 text-sm text-white transition hover:bg-white/[0.085] active:translate-y-px"
              onClick={actions.refresh}
              type="button"
            >
              <RefreshCw className={loading ? "animate-spin" : ""} size={16} /> 刷新
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#f0b84d] px-3 text-sm font-semibold text-[#071112] transition active:translate-y-px"
              onClick={actions.exportReport}
              type="button"
            >
              <Download size={16} /> 导出日报
            </button>
          </>
        }
      />

      <div className="motion-item mb-4 grid gap-3 xl:grid-cols-[1fr_auto_auto]">
        <div className="grid gap-3 rounded-xl border border-white/10 bg-[#071112]/58 p-3 md:grid-cols-2">
          {[
            { icon: Clock3, label: "观测窗口", value: timeWindow, note: activeTrend ? `${activeTrend.label} / ${activeTrend.value}` : "等待数据" },
            { icon: Eye, label: "待处理缺口", value: String(pendingGaps.length), note: pendingGaps[0] ? String(pendingGaps[0].id) : "当前无阻塞" }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div className="flex min-w-0 items-center gap-3 rounded-lg border border-white/8 bg-white/[0.035] px-3 py-2" key={item.label}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#35d7c7]/10 text-[#8df0e5]">
                  <Icon size={17} />
                </span>
                <span className="min-w-0">
                  <small className="block truncate text-xs text-[#9fb8b4]">{item.label}</small>
                  <strong className="block truncate text-sm text-[#eef8f6]">{item.value}</strong>
                  <small className="block truncate text-xs text-[#6f8c88]">{item.note}</small>
                </span>
              </div>
            );
          })}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-2">
          <div className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold text-[#9fb8b4]">
            <SlidersHorizontal size={14} /> 时间窗口
          </div>
          <div className="grid grid-cols-3 gap-1">
            {timeWindows.map((item) => (
              <button
                className={`min-h-10 rounded-lg px-3 text-sm transition active:translate-y-px ${timeWindow === item ? "bg-[#35d7c7] font-semibold text-[#071112]" : "bg-white/[0.045] text-[#9fb8b4] hover:bg-white/[0.08]"}`}
                key={item}
                onClick={() => setTimeWindow(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-2">
          <div className="mb-2 px-1 text-xs font-semibold text-[#9fb8b4]">刷新频率</div>
          <div className="grid grid-cols-3 gap-1">
            {refreshCadences.map((item) => (
              <button
                className={`min-h-10 rounded-lg px-3 text-sm transition active:translate-y-px ${refreshCadence === item ? "bg-[#f0b84d] font-semibold text-[#071112]" : "bg-white/[0.045] text-[#9fb8b4] hover:bg-white/[0.08]"}`}
                key={item}
                onClick={() => setRefreshCadence(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="motion-item grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {snapshot.data.map((metric) => <MetricTile className="data-kpi-card" dark key={metric.label} metric={metric} />)}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_1.15fr_.9fr]">
        <Panel className="data-chart-panel motion-item min-h-[320px]" dark>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold">客流热力</h2>
            <StatusBadge tone="accent">空间数据</StatusBadge>
          </div>
          <div className="relative h-[240px] overflow-hidden rounded-xl border border-white/10 bg-[#071112]">
            <div className="absolute inset-8 rounded-[45%] border border-[#35d7c7]/18" />
            <div className="absolute left-[18%] top-[45%] h-20 w-28 rounded-full bg-[#35d7c7]/35 blur-xl" />
            <div className="absolute left-[44%] top-[30%] h-28 w-36 rounded-full bg-[#f0b84d]/42 blur-xl" />
            <div className="absolute right-[18%] top-[50%] h-20 w-24 rounded-full bg-[#ff6b5f]/36 blur-xl" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:28px_28px]" />
            <div className="absolute left-5 top-5 rounded-lg bg-[#071112]/70 px-3 py-2 text-xs text-[#9fb8b4]">九龙灌浴拥堵</div>
            <div className="soft-pulse absolute right-8 top-12 h-4 w-4 rounded-full bg-[#ff6b5f]" />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-white/58"><span>低</span><b className="h-2 flex-1 rounded-full bg-[linear-gradient(90deg,#35d7c7,#f0b84d,#ff6b5f)]" /><span>高</span></div>
        </Panel>

        <Panel className="data-chart-panel motion-item min-h-[320px]" dark>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold">排队预测</h2>
            <StatusBadge tone="success">30 秒轮询</StatusBadge>
          </div>
          <LineChart activeIndex={activeTrendIndex} data={trendData} onActiveIndexChange={setActiveTrendIndex} />
        </Panel>

        <Panel className="data-chart-panel motion-item min-h-[320px]" dark>
          <h2 className="mb-4 text-base font-bold">票务核验</h2>
          <DonutChart />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[.9fr_1fr_1.2fr]">
        <Panel className="data-chart-panel motion-item min-h-[300px]" dark>
          <h2 className="mb-4 text-base font-bold">游客画像</h2>
          <div className="grid gap-3">
            {[
              ["<18", 8],
              ["18-30", 28],
              ["31-45", 36],
              ["46-60", 20],
              [">60", 8]
            ].map(([label, value]) => (
              <div className="grid grid-cols-[56px_1fr_44px] items-center gap-3" key={label as string}>
                <span className="text-sm text-white/58">{label}</span>
                <span className="h-3 rounded-full bg-white/10"><i className="data-bar-fill block h-3 rounded-full bg-[#35d7c7]" style={{ width: `${value}%` }} /></span>
                <strong className="text-right text-sm">{value}%</strong>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="data-chart-panel motion-item min-h-[300px]" dark>
          <h2 className="mb-4 text-base font-bold">知识质量监控</h2>
          <RadarChart />
        </Panel>

        <Panel className="data-chart-panel motion-item min-h-[300px]" dark>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold">工单趋势</h2>
            <button className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#ff6b5f]/12 px-3 text-xs text-[#ffaaa3]" onClick={openGapDrawer} type="button">
              <TriangleAlert size={14} /> 标记知识缺口
            </button>
          </div>
          <BarChart data={snapshot.workOrderTrend} />
        </Panel>
      </div>

      {gapDrawerOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-[#020707]/55 p-3 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-label="标记知识缺口">
          <button className="absolute inset-0 h-full w-full cursor-default" disabled={Boolean(busyAction)} onClick={() => setGapDrawerOpen(false)} type="button" aria-label="关闭知识缺口面板" />
          <div ref={gapDrawerRef} className="relative w-full max-w-[480px] overflow-hidden rounded-2xl border border-white/10 bg-[#081416] shadow-[0_28px_90px_rgba(0,0,0,.42)]">
            <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div>
                <StatusBadge tone="warning">知识缺口</StatusBadge>
                <h2 className="mt-3 text-lg font-bold text-[#eef8f6]">标记处理</h2>
              </div>
              <button
                aria-label="关闭"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.055] text-[#9fb8b4] transition hover:bg-white/[0.09] active:translate-y-px"
                disabled={Boolean(busyAction)}
                onClick={() => setGapDrawerOpen(false)}
                type="button"
              >
                <X size={17} />
              </button>
            </header>
            <form className="grid gap-4 px-5 py-5" onSubmit={submitGap}>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#d6e6e3]">缺口 ID</span>
                <select
                  className="min-h-11 rounded-xl border border-white/10 bg-[#0d1b1e] px-3 text-sm text-[#eef8f6] outline-none transition focus:border-[#35d7c7]/55"
                  onChange={(event) => {
                    setDraftGapId(event.target.value);
                    if (gapError) setGapError("");
                  }}
                  value={draftGapId}
                >
                  {pendingGaps.length ? (
                    pendingGaps.map((gap) => (
                      <option key={String(gap.id)} value={String(gap.id)}>
                        {String(gap.id)} - {String(gap.dataType ?? "data_gap")}
                      </option>
                    ))
                  ) : (
                    <option value="GAP-001">GAP-001</option>
                  )}
                </select>
              </label>
              <div className="rounded-xl border border-white/10 bg-white/[0.055] px-3 py-3 text-sm leading-6 text-[#9fb8b4]">
                {selectedGap ? String(selectedGap.description ?? selectedGap.impact ?? "待处理知识缺口") : "当前使用默认知识缺口 ID。"}
              </div>
              {gapError ? <div className="rounded-xl border border-[#ff6b5f]/25 bg-[#ff6b5f]/12 px-3 py-2 text-sm text-[#ffaaa3]">{gapError}</div> : null}
              <div className={`rounded-xl px-3 py-2 text-sm ${lastAction.tone === "danger" ? "bg-[#ff6b5f]/12 text-[#ffaaa3]" : "bg-white/[0.055] text-[#9fb8b4]"}`}>
                {busyAction ? `${busyAction}处理中...` : lastAction.text}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button className="min-h-11 rounded-xl border border-white/10 bg-white/[0.055] text-sm font-semibold text-[#d6e6e3]" disabled={Boolean(busyAction)} onClick={() => setGapDrawerOpen(false)} type="button">
                  取消
                </button>
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#35d7c7] text-sm font-semibold text-[#071112] disabled:cursor-wait disabled:opacity-60" disabled={Boolean(busyAction)} type="submit">
                  <CheckCircle2 size={16} /> {busyAction ? "提交中" : "标记已处理"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AnimatedSection>
  );
}
