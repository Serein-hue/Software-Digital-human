import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Activity, Bot, Mic, Plus, RotateCcw, Send, Settings, Trash2, Video, X, type LucideIcon } from "lucide-react";
import { gsap } from "gsap";
import { AnimatedSection } from "../../components/motion/AnimatedSection";
import { PageHeader } from "../../components/layout/PageHeader";
import { MetricTile } from "../../components/ui/MetricTile";
import { Panel } from "../../components/ui/Panel";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { avatarMetrics, avatarTasks, capabilityMetrics, hotQuestions } from "../../data/operations";
import { useAdminData } from "../../hooks/useAdminData";

const avatarImages = {
  normal: "/fay-robot/Normal.jpg",
  speaking: "/fay-robot/Speaking.jpg",
  listening: "/fay-robot/Listening.jpg",
  thinking: "/fay-robot/Thinking.jpg"
};

type AvatarMode = keyof typeof avatarImages;
type AvatarActionKind = "broadcast" | "transparent";
type AvatarFeedback = {
  title: string;
  detail: string;
  tone: "success" | "warning" | "accent" | "neutral";
};
type RuntimeConfig = {
  name: string;
  assetBase: string;
  model: string;
  transport: string;
  tts: string;
  vad: string;
  transparentPassUser: string;
  liveEndpoint: string;
};

const modes: { id: AvatarMode; label: string; tone: "success" | "warning" | "accent" | "neutral" }[] = [
  { id: "normal", label: "待机", tone: "neutral" },
  { id: "listening", label: "聆听", tone: "accent" },
  { id: "thinking", label: "检索", tone: "warning" },
  { id: "speaking", label: "口播", tone: "success" }
];

const defaultRuntimeConfig: RuntimeConfig = {
  name: "灵灵 Fay",
  assetBase: "/fay-robot",
  model: "fay-robot",
  transport: "fay-runtime",
  tts: "local-tts",
  vad: "runtime-microphone",
  transparentPassUser: "User",
  liveEndpoint: "/api/start-live"
};

function readRuntimeConfig(runtime?: Record<string, unknown>): RuntimeConfig {
  const config = runtime?.avatarConfig;
  const record = typeof config === "object" && config !== null ? (config as Record<string, unknown>) : {};
  return {
    name: typeof record.name === "string" ? record.name : defaultRuntimeConfig.name,
    assetBase: typeof record.assetBase === "string" ? record.assetBase : defaultRuntimeConfig.assetBase,
    model: typeof record.model === "string" ? record.model : defaultRuntimeConfig.model,
    transport: typeof record.transport === "string" ? record.transport : defaultRuntimeConfig.transport,
    tts: typeof record.tts === "string" ? record.tts : defaultRuntimeConfig.tts,
    vad: typeof record.vad === "string" ? record.vad : defaultRuntimeConfig.vad,
    transparentPassUser: typeof record.transparentPassUser === "string" ? record.transparentPassUser : defaultRuntimeConfig.transparentPassUser,
    liveEndpoint: typeof record.liveEndpoint === "string" ? record.liveEndpoint : defaultRuntimeConfig.liveEndpoint
  };
}

export function AvatarPage() {
  const { snapshot, connected, busyAction, lastAction, actions } = useAdminData();
  const [mode, setMode] = useState<AvatarMode>("speaking");
  const [activeAction, setActiveAction] = useState<AvatarActionKind | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftTarget, setDraftTarget] = useState("all");
  const [draftPriority, setDraftPriority] = useState("normal");
  const [draftError, setDraftError] = useState("");
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig>(defaultRuntimeConfig);
  const [avatarFeedback, setAvatarFeedback] = useState<AvatarFeedback>({
    title: "运行台已接入",
    detail: "数字人形象优先读取后端 runtime image set，控制动作已接入后端或预留运行接口。",
    tone: "success"
  });
  const imageRef = useRef<HTMLImageElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const actionPanelRef = useRef<HTMLDivElement>(null);
  const currentMode = modes.find((item) => item.id === mode) ?? modes[0];
  const runtimeImageSet = snapshot.avatarImageSet ?? {};
  const avatarImage = runtimeImageSet[mode] || snapshot.avatarImageUrl || avatarImages[mode];

  const runtimeLabel = useMemo(
    () => (snapshot.avatarImageSource === "runtime" ? "后端运行时形象" : connected ? "后端在线 / 本地图像" : "使用本地形象 fallback"),
    [connected, snapshot.avatarImageSource]
  );

  useEffect(() => {
    if (!imageRef.current) return;
    gsap.fromTo(imageRef.current, { opacity: 0.35, scale: 0.985 }, { opacity: 1, scale: 1, duration: 0.42, ease: "power3.out" });
  }, [mode]);

  useEffect(() => {
    setRuntimeConfig(readRuntimeConfig(snapshot.runtime));
  }, [snapshot.runtime]);

  useEffect(() => {
    if (!waveRef.current) return;
    const bars = waveRef.current.querySelectorAll("span");
    const tween = gsap.to(bars, {
      scaleY: mode === "speaking" ? 1.8 : 1.12,
      opacity: mode === "speaking" ? 0.95 : 0.48,
      duration: 0.48,
      ease: "sine.inOut",
      stagger: { each: 0.018, repeat: -1, yoyo: true }
    });
    return () => {
      tween.kill();
    };
  }, [mode]);

  useEffect(() => {
    if (!activeAction || !actionPanelRef.current) return;
    gsap.fromTo(actionPanelRef.current, { autoAlpha: 0, x: 36 }, { autoAlpha: 1, x: 0, duration: 0.28, ease: "power3.out" });
  }, [activeAction]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo("[data-avatar-feedback]", { opacity: 0.62, y: -8 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" });
  }, [avatarFeedback.title, mode]);

  function selectMode(item: (typeof modes)[number]) {
    setMode(item.id);
    setAvatarFeedback({
      title: `已切换为${item.label}状态`,
      detail: "舞台形象、声波与运行标识已同步到当前数字人状态。",
      tone: item.tone
    });
  }

  function openAvatarAction(kind: AvatarActionKind, text: string, target = "all", priority = "normal") {
    setActiveAction(kind);
    setDraftText(text);
    setDraftTarget(target);
    setDraftPriority(priority);
    setDraftError("");
    setAvatarFeedback({
      title: kind === "transparent" ? "透明传参面板已打开" : "广播任务面板已打开",
      detail: kind === "transparent" ? `目标用户：${target}` : `目标区域：${target}，优先级：${priority}`,
      tone: kind === "transparent" ? "accent" : "success"
    });
  }

  function closeAvatarAction() {
    setActiveAction(null);
    setDraftError("");
  }

  async function submitAvatarAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draftText.trim();
    if (!text) {
      setDraftError(activeAction === "transparent" ? "请输入要透传给数字人的内容。" : "请输入要创建的播报内容。");
      return;
    }

    const ok =
      activeAction === "transparent"
        ? await actions.transparentPass(text, draftTarget)
        : await actions.createBroadcast(text, { target: draftTarget, priority: draftPriority });
    if (ok) {
      setMode(activeAction === "transparent" ? "thinking" : "speaking");
      setAvatarFeedback({
        title: activeAction === "transparent" ? "透明传参已发送" : "广播任务已创建",
        detail: activeAction === "transparent" ? `已发送给 ${draftTarget}。` : `已发送到 ${draftTarget}，优先级 ${draftPriority}。`,
        tone: activeAction === "transparent" ? "accent" : "success"
      });
      closeAvatarAction();
    }
  }

  async function saveRuntimeConfig() {
    const ok = await actions.updateRuntimeConfig(runtimeConfig);
    setAvatarFeedback({
      title: ok ? "Fay 运行配置已保存" : "Fay 运行配置保存失败",
      detail: ok ? `形象基址 ${runtimeConfig.assetBase}，模型 ${runtimeConfig.model} 已同步到后端 runtime。` : "请检查后端 runtime/config 接口状态。",
      tone: ok ? "success" : "warning"
    });
  }

  const stageActions: { id: string; label: string; icon: LucideIcon; action: () => void }[] = [
    {
      id: "live",
      label: "启动直播",
      icon: Video,
      action: () => {
        setMode("speaking");
        setAvatarFeedback({ title: "直播启动请求已发送", detail: "已调用 Fay start-live 接口，舞台切换为口播状态。", tone: "success" });
        void actions.startLive();
      }
    },
    {
      id: "mic",
      label: "麦克风",
      icon: Mic,
      action: () => {
        setMode("listening");
        setAvatarFeedback({ title: "麦克风状态切换中", detail: "已调用 runtime microphone toggle，舞台切换为聆听状态。", tone: "accent" });
        void actions.toggleMicrophone();
      }
    },
    {
      id: "clear",
      label: "清空队列",
      icon: Trash2,
      action: () => {
        setMode("normal");
        setAvatarFeedback({ title: "清空队列请求已发送", detail: "已调用 runtime clear-queue，播报队列将刷新。", tone: "warning" });
        void actions.clearQueue();
      }
    },
    { id: "transparent", label: "透明传参", icon: Send, action: () => openAvatarAction("transparent", "请播报当前景区欢迎语。", "User") },
    {
      id: "reconnect",
      label: "重连状态",
      icon: RotateCcw,
      action: () => {
        setAvatarFeedback({ title: "正在重新同步运行态", detail: "已请求 runtime、Fay、知识库和播报队列最新快照。", tone: "neutral" });
        void actions.refresh();
      }
    }
  ];

  return (
    <AnimatedSection className="avatar-light overflow-x-hidden">
      <PageHeader
        index="02"
        title="数字人值守"
        description="使用 Fay 真实数字人形象资产，连接后端运行态、口播队列、麦克风、直播和透明传参动作。"
        actions={
          <>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#dfe5e1] bg-white px-3 text-sm text-[#52615e] transition hover:bg-[#eef3f0] active:translate-y-px"
              onClick={() => document.getElementById("fay-config-panel")?.scrollIntoView({ behavior: "smooth", block: "center" })}
              type="button"
            >
              <Settings size={16} /> 数字人配置
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#dfe5e1] bg-white px-3 text-sm text-[#52615e] transition hover:bg-[#eef3f0] active:translate-y-px"
              onClick={() => void actions.reindexKnowledge()}
              type="button"
            >
              <Settings size={16} /> 重建知识库
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0f6857] px-3 text-sm font-semibold text-white transition active:translate-y-px"
              onClick={() => openAvatarAction("broadcast", "请各位游客留意现场广播，合理规划游览路线。")}
              type="button"
            >
              <Plus size={16} /> 新增播报
            </button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)_320px] xl:items-start">
        <aside className="motion-item grid gap-3">
          <section className="rounded-2xl border border-[#dfe5e1] bg-white/88 p-4 shadow-[0_18px_42px_rgba(20,35,32,.08)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#9ceadf]/45 bg-[#e8fbf7] text-[#0f6857]">
                <Bot size={25} />
              </div>
              <div className="min-w-0">
                <StatusBadge tone={connected ? "success" : "warning"}>{runtimeLabel}</StatusBadge>
                <strong className="mt-1 block truncate text-lg text-[#26302e]">{runtimeConfig.name || "灵灵 Fay"}</strong>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              {avatarMetrics.slice(0, 3).map((metric) => (
                <article className="rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 py-3" key={metric.label}>
                  <span className="text-xs text-[#71807d]">{metric.label}</span>
                  <strong className="mt-1 block text-2xl text-[#26302e]">{metric.value}</strong>
                  <small className="text-xs text-[#71807d]">{metric.note}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#dfe5e1] bg-white/88 p-4 shadow-[0_18px_42px_rgba(20,35,32,.08)] backdrop-blur-xl">
            <h2 className="text-base font-bold text-[#26302e]">能力链路</h2>
            <div className="mt-3 grid gap-2">
              {capabilityMetrics.map((metric) => (
                <div className="flex items-center justify-between rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 py-2" key={metric.label}>
                  <span className="text-sm text-[#52615e]">{metric.label}</span>
                  <strong className="text-sm text-[#26302e]">{metric.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section data-runtime-source className="rounded-2xl border border-[#dfe5e1] bg-white/88 p-4 shadow-[0_18px_42px_rgba(20,35,32,.08)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-[#26302e]">形象来源</h2>
              <StatusBadge tone={snapshot.avatarImageSource === "runtime" ? "success" : "warning"}>
                {snapshot.avatarImageSource === "runtime" ? "后端传输" : "fallback"}
              </StatusBadge>
            </div>
            <strong className="mt-3 block text-sm text-[#26302e]">{runtimeLabel}</strong>
            <p className="mt-1 break-all text-xs leading-5 text-[#71807d]">{avatarImage}</p>
          </section>
        </aside>

        <section className="avatar-stage-light motion-item relative min-h-[620px] overflow-hidden rounded-2xl border border-[#dfe5e1] bg-[#eef5f1] p-5 shadow-[0_26px_70px_rgba(20,35,32,.14)]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.72),rgba(230,240,236,.86)),linear-gradient(115deg,rgba(15,104,87,.16),transparent_42%),linear-gradient(245deg,rgba(210,151,44,.12),transparent_38%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,rgba(216,230,224,.82))]" />

          <div className="relative z-10 grid min-h-[580px] grid-rows-[112px_minmax(300px,1fr)_120px] gap-3">
            <div className="rounded-xl border border-[#dfe5e1] bg-white/90 p-3 shadow-[0_18px_42px_rgba(20,35,32,.08)] backdrop-blur-xl">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge tone={currentMode.tone}>{mode === "speaking" ? "正在播报" : currentMode.label}</StatusBadge>
                    <span className="text-xs text-[#71807d]">runtime image set</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#52615e]">欢迎来到灵山景区。我是您的 AI 导游员，祝您旅途愉快。</p>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {modes.map((item) => (
                    <button
                      className={`min-h-9 rounded-lg px-3 text-xs transition active:translate-y-px ${
                        mode === item.id ? "bg-[#0f6857] text-white" : "border border-[#dfe5e1] bg-[#f7f8f6] text-[#52615e]"
                      }`}
                      key={item.id}
                      onClick={() => selectMode(item)}
                      type="button"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div ref={waveRef} className="mt-2 flex h-8 items-center gap-1 overflow-hidden">
                {Array.from({ length: 64 }, (_, index) => (
                  <span
                    className="w-1 shrink-0 origin-center rounded-full bg-[#0f6857]/34"
                    key={index}
                    style={{ height: `${8 + ((index * 13) % 30)}px` }}
                  />
                ))}
              </div>
            </div>

            <div className="relative grid min-h-0 gap-3 lg:grid-cols-[230px_minmax(280px,1fr)_180px] lg:items-end">
              <div data-avatar-feedback className="grid gap-3 self-start">
                <div className="rounded-xl border border-[#9ceadf]/45 bg-[#e9f7f4]/88 px-3 py-3 shadow-[0_16px_36px_rgba(20,35,32,.08)] backdrop-blur">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#0f6857]">
                    <Activity size={14} /> 运行回执
                  </div>
                  <strong className="block text-sm text-[#26302e]">{avatarFeedback.title}</strong>
                  <p className="mt-1 text-xs leading-5 text-[#71807d]">{avatarFeedback.detail}</p>
                </div>
                <div className="rounded-xl border border-[#dfe5e1] bg-white/88 px-3 py-3 shadow-[0_16px_36px_rgba(20,35,32,.08)] backdrop-blur">
                  <span className="text-xs font-semibold text-[#71807d]">当前播报</span>
                  <strong className="mt-2 block text-sm text-[#26302e]">景区日常欢迎语</strong>
                  <p className="mt-1 text-xs leading-5 text-[#71807d]">08:00-23:00 每日循环，可由右侧队列切换。</p>
                </div>
              </div>

              <div className="pointer-events-none relative mx-auto flex h-full w-full items-end justify-center overflow-hidden">
                <div className="absolute bottom-0 h-[72%] w-[78%] rounded-t-full bg-white/38 blur-sm" />
                <img
                  ref={imageRef}
                  alt="数字人导游运行形象"
                  className="relative z-10 max-h-[360px] w-[min(340px,78%)] object-contain object-bottom drop-shadow-[0_28px_54px_rgba(20,35,32,.24)]"
                  src={avatarImage}
                />
              </div>

              <div className="grid gap-2 self-start">
                {stageActions.map(({ id, label, icon: Icon, action }) => (
                  <button
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#dfe5e1] bg-white/88 px-3 text-sm text-[#26302e] backdrop-blur-xl transition hover:bg-[#eef3f0] active:translate-y-px"
                    data-stage-action={id}
                    disabled={Boolean(busyAction)}
                    key={label}
                    onClick={action}
                    type="button"
                  >
                    <Icon size={16} /> {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[.85fr_1.25fr_.9fr]">
              <div className="rounded-xl border border-[#dfe5e1] bg-white/90 p-3 shadow-[0_16px_36px_rgba(20,35,32,.08)] backdrop-blur">
                <h2 className="mb-2 text-sm font-bold text-[#26302e]">实时会话</h2>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["当前会话", "12"],
                    ["今日会话", "1,268"],
                    ["平均时长", "02:48"]
                  ].map(([label, value]) => (
                    <article className="rounded-lg bg-[#f7f8f6] p-2.5 text-center" key={label}>
                      <span className="block text-xs text-[#71807d]">{label}</span>
                      <strong className="mt-1 block text-lg text-[#26302e]">{value}</strong>
                    </article>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#dfe5e1] bg-white/90 p-3 shadow-[0_16px_36px_rgba(20,35,32,.08)] backdrop-blur">
                <h2 className="mb-2 text-sm font-bold text-[#26302e]">热门问题 TOP5</h2>
                <div className="grid grid-cols-2 gap-x-5 gap-y-2">
                  {hotQuestions.slice(0, 5).map((question, index) => (
                    <div className="grid grid-cols-[20px_1fr_44px] items-center gap-2 text-sm" key={question.label}>
                      <span className="font-bold text-[#0f6857]">{index + 1}</span>
                      <strong className="truncate text-[#26302e]">{question.label}</strong>
                      <em className="text-right not-italic text-[#71807d]">{question.value}</em>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#dfe5e1] bg-white/90 p-3 shadow-[0_16px_36px_rgba(20,35,32,.08)] backdrop-blur">
                <h2 className="mb-2 text-sm font-bold text-[#26302e]">知识推荐表现</h2>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <span><strong className="block text-lg text-[#26302e]">2,653</strong><small className="text-[#71807d]">检索次数</small></span>
                  <span><strong className="block text-lg text-[#0f6857]">92.6%</strong><small className="text-[#71807d]">命中率</small></span>
                  <span><strong className="block text-lg text-[#c76d24]">3.1%</strong><small className="text-[#71807d]">无结果率</small></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="motion-item rounded-2xl border border-[#dfe5e1] bg-white/90 p-4 shadow-[0_18px_42px_rgba(20,35,32,.08)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-[#26302e]">播报任务队列</h2>
            <StatusBadge tone="accent">可操作</StatusBadge>
          </div>
          <div className="grid gap-3">
            {avatarTasks.map((task) => (
              <article className="flex items-center justify-between gap-3 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] p-3" key={task.id}>
                <div>
                  <strong className="block text-sm text-[#26302e]">{task.title}</strong>
                  <small className="text-xs text-[#71807d]">{task.time}</small>
                </div>
                <StatusBadge tone={task.tone}>{task.state}</StatusBadge>
              </article>
            ))}
          </div>
          <button
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0f6857] text-sm font-semibold text-white transition active:translate-y-px"
            onClick={() => openAvatarAction("broadcast", "请各位游客留意，九龙灌浴区域当前排队较长，建议错峰参观。", "jiulong", "high")}
            type="button"
          >
            <Plus size={16} /> 新增播报任务
          </button>
          <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${lastAction.tone === "danger" ? "bg-[#ff6b5f]/12 text-[#ad3f37]" : "bg-[#f7f8f6] text-[#71807d]"}`}>
            {busyAction ? `${busyAction} 处理中...` : lastAction.text}
          </div>
        </aside>
      </div>

      <section id="fay-config-panel" className="motion-item mt-4 rounded-2xl border border-[#dfe5e1] bg-white/90 p-4 shadow-[0_18px_42px_rgba(20,35,32,.08)] backdrop-blur-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#26302e]">Fay 角色配置</h2>
            <p className="mt-1 text-sm text-[#71807d]">配置由后端 runtime 保存，首屏只展示运行态和播报队列。</p>
          </div>
          <StatusBadge tone={snapshot.avatarImageSource === "runtime" ? "success" : "warning"}>
            {snapshot.avatarImageSource === "runtime" ? "后端传输" : "fallback"}
          </StatusBadge>
        </div>
        <div className="grid gap-3 lg:grid-cols-4">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-[#71807d]">角色名称</span>
            <input
              className="min-h-10 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 text-sm text-[#26302e] outline-none focus:border-[#0f6857]/45"
              onChange={(event) => setRuntimeConfig((value) => ({ ...value, name: event.target.value }))}
              value={runtimeConfig.name}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-[#71807d]">形象资源基址</span>
            <input
              className="min-h-10 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 text-sm text-[#26302e] outline-none focus:border-[#0f6857]/45"
              onChange={(event) => setRuntimeConfig((value) => ({ ...value, assetBase: event.target.value }))}
              value={runtimeConfig.assetBase}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-[#71807d]">模型</span>
            <select
              className="min-h-10 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 text-sm text-[#26302e] outline-none focus:border-[#0f6857]/45"
              onChange={(event) => setRuntimeConfig((value) => ({ ...value, model: event.target.value }))}
              value={runtimeConfig.model}
            >
              <option value="fay-robot">fay-robot</option>
              <option value="fay-live2d">fay-live2d</option>
              <option value="fay-video">fay-video</option>
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-[#71807d]">传输</span>
            <select
              className="min-h-10 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 text-sm text-[#26302e] outline-none focus:border-[#0f6857]/45"
              onChange={(event) => setRuntimeConfig((value) => ({ ...value, transport: event.target.value }))}
              value={runtimeConfig.transport}
            >
              <option value="fay-runtime">fay-runtime</option>
              <option value="websocket">websocket</option>
              <option value="http-polling">http-polling</option>
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-[#71807d]">TTS</span>
            <input
              className="min-h-10 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 text-sm text-[#26302e] outline-none focus:border-[#0f6857]/45"
              onChange={(event) => setRuntimeConfig((value) => ({ ...value, tts: event.target.value }))}
              value={runtimeConfig.tts}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-[#71807d]">VAD</span>
            <input
              className="min-h-10 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 text-sm text-[#26302e] outline-none focus:border-[#0f6857]/45"
              onChange={(event) => setRuntimeConfig((value) => ({ ...value, vad: event.target.value }))}
              value={runtimeConfig.vad}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-[#71807d]">透明传参用户</span>
            <input
              className="min-h-10 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 text-sm text-[#26302e] outline-none focus:border-[#0f6857]/45"
              onChange={(event) => setRuntimeConfig((value) => ({ ...value, transparentPassUser: event.target.value }))}
              value={runtimeConfig.transparentPassUser}
            />
          </label>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 self-end rounded-xl bg-[#0f6857] px-4 text-sm font-semibold text-white transition active:translate-y-px disabled:cursor-wait disabled:opacity-60"
            disabled={Boolean(busyAction)}
            onClick={saveRuntimeConfig}
            type="button"
          >
            <Settings size={16} /> 保存 Fay 配置
          </button>
        </div>
      </section>

      <div className="hidden">
        <div className="motion-item grid gap-4">
          <Panel dark>
            <h2 className="mb-4 text-base font-bold">运行状态</h2>
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-xl border border-[#35d7c7]/24 bg-[#35d7c7]/10 text-[#8df0e5]">
                <Bot size={28} />
              </div>
              <div>
                <StatusBadge tone={connected ? "success" : "warning"}>{runtimeLabel}</StatusBadge>
                <strong className="mt-1 block text-lg">灵灵 Fay</strong>
              </div>
            </div>
            <div className="grid gap-3">
              {avatarMetrics.map((metric) => <MetricTile dark key={metric.label} metric={metric} />)}
            </div>
          </Panel>

          <Panel dark>
            <h2 className="mb-4 text-base font-bold">能力链路</h2>
            <div className="grid gap-2">
              {capabilityMetrics.map((metric) => (
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2" key={metric.label}>
                  <span className="text-sm text-[#9fb8b4]">{metric.label}</span>
                  <strong className="text-sm text-[#8df0e5]">{metric.value}</strong>
                </div>
              ))}
            </div>
          </Panel>

          <div id="fay-config-panel">
            <Panel dark>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-bold">Fay 角色配置</h2>
                <StatusBadge tone={snapshot.avatarImageSource === "runtime" ? "success" : "warning"}>
                  {snapshot.avatarImageSource === "runtime" ? "后端传输" : "fallback"}
                </StatusBadge>
              </div>
              <div className="grid gap-3">
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold text-[#71807d]">角色名称</span>
                  <input
                    className="min-h-10 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 text-sm text-[#26302e] outline-none focus:border-[#0f6857]/45"
                    onChange={(event) => setRuntimeConfig((value) => ({ ...value, name: event.target.value }))}
                    value={runtimeConfig.name}
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold text-[#71807d]">形象资源基址</span>
                  <input
                    className="min-h-10 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 text-sm text-[#26302e] outline-none focus:border-[#0f6857]/45"
                    onChange={(event) => setRuntimeConfig((value) => ({ ...value, assetBase: event.target.value }))}
                    value={runtimeConfig.assetBase}
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold text-[#71807d]">模型</span>
                    <select
                      className="min-h-10 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 text-sm text-[#26302e] outline-none focus:border-[#0f6857]/45"
                      onChange={(event) => setRuntimeConfig((value) => ({ ...value, model: event.target.value }))}
                      value={runtimeConfig.model}
                    >
                      <option value="fay-robot">fay-robot</option>
                      <option value="fay-live2d">fay-live2d</option>
                      <option value="fay-video">fay-video</option>
                    </select>
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold text-[#71807d]">传输</span>
                    <select
                      className="min-h-10 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 text-sm text-[#26302e] outline-none focus:border-[#0f6857]/45"
                      onChange={(event) => setRuntimeConfig((value) => ({ ...value, transport: event.target.value }))}
                      value={runtimeConfig.transport}
                    >
                      <option value="fay-runtime">fay-runtime</option>
                      <option value="websocket">websocket</option>
                      <option value="http-polling">http-polling</option>
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold text-[#71807d]">TTS</span>
                    <input
                      className="min-h-10 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 text-sm text-[#26302e] outline-none focus:border-[#0f6857]/45"
                      onChange={(event) => setRuntimeConfig((value) => ({ ...value, tts: event.target.value }))}
                      value={runtimeConfig.tts}
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold text-[#71807d]">VAD</span>
                    <input
                      className="min-h-10 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 text-sm text-[#26302e] outline-none focus:border-[#0f6857]/45"
                      onChange={(event) => setRuntimeConfig((value) => ({ ...value, vad: event.target.value }))}
                      value={runtimeConfig.vad}
                    />
                  </label>
                </div>
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold text-[#71807d]">透明传参用户</span>
                  <input
                    className="min-h-10 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 text-sm text-[#26302e] outline-none focus:border-[#0f6857]/45"
                    onChange={(event) => setRuntimeConfig((value) => ({ ...value, transparentPassUser: event.target.value }))}
                    value={runtimeConfig.transparentPassUser}
                  />
                </label>
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0f6857] px-4 text-sm font-semibold text-white transition active:translate-y-px disabled:cursor-wait disabled:opacity-60"
                  disabled={Boolean(busyAction)}
                  onClick={saveRuntimeConfig}
                  type="button"
                >
                  <Settings size={16} /> 保存 Fay 配置
                </button>
              </div>
            </Panel>
          </div>
        </div>

        <section className="avatar-stage-light motion-item relative grid min-h-[560px] grid-rows-[auto_auto_auto] gap-3 overflow-hidden rounded-2xl border border-[#dfe5e1] bg-[linear-gradient(180deg,rgba(255,255,255,.42),rgba(236,244,240,.72))] bg-cover bg-center p-5 shadow-[0_26px_70px_rgba(20,35,32,.14)] lg:grid-rows-[128px_270px_auto]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(255,255,255,.08),rgba(234,242,239,.70)_58%,rgba(224,234,230,.88))]" />

          <div className="relative z-10 min-h-0 rounded-xl border border-[#dfe5e1] bg-white/88 p-3 shadow-[0_18px_42px_rgba(20,35,32,.08)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={currentMode.tone}>{currentMode.label}</StatusBadge>
                  <span className="text-xs text-[#71807d]">{snapshot.avatarImageSource === "runtime" ? "runtime image set" : "local image fallback"}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#52615e]">欢迎来到灵山景区。我是您的 AI 导游员，祝您旅途愉快。</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {modes.map((item) => (
                  <button
                    className={`min-h-10 rounded-lg px-3 text-xs transition active:translate-y-px ${
                      mode === item.id ? "bg-[#0f6857] text-white" : "border border-[#dfe5e1] bg-[#f7f8f6] text-[#52615e]"
                    }`}
                    key={item.id}
                    onClick={() => selectMode(item)}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div ref={waveRef} className="mt-2 flex h-8 items-center gap-1">
              {Array.from({ length: 64 }, (_, index) => (
                <span
                  className="w-1 origin-center rounded-full bg-[#0f6857]/34"
                  key={index}
                  style={{ height: `${8 + ((index * 13) % 30)}px` }}
                />
              ))}
            </div>
          </div>

          <div className="relative z-10 grid min-h-0 gap-3 lg:grid-cols-[250px_minmax(220px,1fr)_190px] lg:items-end">
            <div data-avatar-feedback className="grid gap-3 self-start">
              <div className="rounded-xl border border-[#35d7c7]/18 bg-white/82 px-3 py-3 shadow-[0_16px_36px_rgba(20,35,32,.08)] backdrop-blur">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#0f6857]">
                  <Activity size={14} /> 运行回执
                </div>
                <strong className="block text-sm text-[#26302e]">{avatarFeedback.title}</strong>
                <p className="mt-1 text-xs leading-5 text-[#71807d]">{avatarFeedback.detail}</p>
              </div>
              <div data-runtime-source className="rounded-xl border border-[#dfe5e1] bg-white/82 px-3 py-3 shadow-[0_16px_36px_rgba(20,35,32,.08)] backdrop-blur">
                <span className="text-xs font-semibold text-[#71807d]">形象来源</span>
                <strong className="mt-2 block text-sm text-[#26302e]">{runtimeLabel}</strong>
                <p className="mt-1 break-all text-xs leading-5 text-[#71807d]">{avatarImage}</p>
              </div>
            </div>

            <div className="pointer-events-none mx-auto h-[270px] w-[min(320px,100%)] overflow-hidden rounded-t-[110px]">
              <img
                ref={imageRef}
                alt="数字人导游真实形象"
                className="h-full w-full object-cover object-top drop-shadow-[0_28px_54px_rgba(20,35,32,.24)]"
                src={avatarImage}
              />
            </div>

            <div className="grid gap-2 self-start">
              {stageActions.map(({ id, label, icon: Icon, action }) => (
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#dfe5e1] bg-white/84 px-3 text-sm text-[#26302e] backdrop-blur-xl transition hover:bg-[#eef3f0] active:translate-y-px"
                  data-stage-action={id}
                  disabled={Boolean(busyAction)}
                  key={label}
                  onClick={action}
                  type="button"
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative z-10 grid gap-3 lg:grid-cols-[.85fr_1.25fr_.9fr]">
            <div className="rounded-xl border border-[#dfe5e1] bg-white/88 p-3 shadow-[0_16px_36px_rgba(20,35,32,.08)] backdrop-blur">
              <h2 className="mb-2 text-sm font-bold text-[#26302e]">实时会话</h2>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["当前会话", "12"],
                  ["今日会话", "1,268"],
                  ["平均时长", "02:48"]
                ].map(([label, value]) => (
                  <article className="rounded-lg bg-[#f7f8f6] p-2.5 text-center" key={label}>
                    <span className="block text-xs text-[#71807d]">{label}</span>
                    <strong className="mt-1 block text-lg text-[#26302e]">{value}</strong>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#dfe5e1] bg-white/88 p-3 shadow-[0_16px_36px_rgba(20,35,32,.08)] backdrop-blur">
              <h2 className="mb-2 text-sm font-bold text-[#26302e]">热门问题 TOP5</h2>
              <div className="grid grid-cols-2 gap-x-5 gap-y-2">
                {hotQuestions.slice(0, 5).map((question, index) => (
                  <div className="grid grid-cols-[20px_1fr_44px] items-center gap-2 text-sm" key={question.label}>
                    <span className="font-bold text-[#0f6857]">{index + 1}</span>
                    <strong className="truncate text-[#26302e]">{question.label}</strong>
                    <em className="text-right not-italic text-[#71807d]">{question.value}</em>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#dfe5e1] bg-white/88 p-3 shadow-[0_16px_36px_rgba(20,35,32,.08)] backdrop-blur">
              <h2 className="mb-2 text-sm font-bold text-[#26302e]">知识推荐表现</h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                <span><strong className="block text-lg text-[#26302e]">2,653</strong><small className="text-[#71807d]">检索次数</small></span>
                <span><strong className="block text-lg text-[#0f6857]">92.6%</strong><small className="text-[#71807d]">命中率</small></span>
                <span><strong className="block text-lg text-[#c76d24]">3.1%</strong><small className="text-[#71807d]">无结果率</small></span>
              </div>
            </div>
          </div>
        </section>

        <Panel className="motion-item" dark>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold">播报任务队列</h2>
            <StatusBadge tone="accent">可操作</StatusBadge>
          </div>
          <div className="grid gap-3">
            {avatarTasks.map((task) => (
              <article className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.055] p-3" key={task.id}>
                <div>
                  <strong className="block text-sm">{task.title}</strong>
                  <small className="text-xs text-[#9fb8b4]">{task.time}</small>
                </div>
                <StatusBadge tone={task.tone}>{task.state}</StatusBadge>
              </article>
            ))}
          </div>
          <button
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#35d7c7] text-sm font-semibold text-[#071112] transition active:translate-y-px"
            onClick={() => openAvatarAction("broadcast", "请各位游客留意，九龙灌浴区域当前排队较长，建议错峰参观。", "jiulong", "high")}
            type="button"
          >
            <Plus size={16} /> 新增广播任务
          </button>
          <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${lastAction.tone === "danger" ? "bg-[#ff6b5f]/12 text-[#ffaaa3]" : "bg-white/[0.05] text-[#9fb8b4]"}`}>
            {busyAction ? `${busyAction}处理中...` : lastAction.text}
          </div>
        </Panel>
      </div>

      {activeAction ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#020707]/45 px-3 py-3 backdrop-blur-sm sm:px-5 sm:py-5" role="presentation">
          <div
            ref={actionPanelRef}
            className="flex h-full w-full max-w-[460px] flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#081416] shadow-[0_30px_100px_rgba(0,0,0,.45)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div>
                <StatusBadge tone={activeAction === "transparent" ? "accent" : "success"}>
                  {activeAction === "transparent" ? "Fay 透传" : "广播任务"}
                </StatusBadge>
                <h2 className="mt-3 text-lg font-bold text-[#eef8f6]">{activeAction === "transparent" ? "透明传参" : "新增播报"}</h2>
              </div>
              <button
                aria-label="关闭操作面板"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.055] text-[#9fb8b4] transition hover:bg-white/[0.09] active:translate-y-px"
                onClick={closeAvatarAction}
                type="button"
              >
                <X size={17} />
              </button>
            </div>

            <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitAvatarAction}>
              <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-5 py-5">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#d6e6e3]">{activeAction === "transparent" ? "透传内容" : "播报内容"}</span>
                  <textarea
                    className="min-h-[168px] resize-none rounded-xl border border-white/10 bg-white/[0.055] px-3 py-3 text-sm leading-6 text-[#eef8f6] outline-none transition placeholder:text-[#5f7773] focus:border-[#35d7c7]/55 focus:bg-white/[0.075]"
                    onChange={(event) => {
                      setDraftText(event.target.value);
                      if (draftError) setDraftError("");
                    }}
                    placeholder={activeAction === "transparent" ? "输入要直接发送给数字人运行时的指令。" : "输入需要创建的广播任务内容。"}
                    value={draftText}
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[#d6e6e3]">{activeAction === "transparent" ? "用户标识" : "广播区域"}</span>
                    <select
                      className="min-h-11 rounded-xl border border-white/10 bg-[#0d1b1e] px-3 text-sm text-[#eef8f6] outline-none transition focus:border-[#35d7c7]/55"
                      onChange={(event) => setDraftTarget(event.target.value)}
                      value={draftTarget}
                    >
                      {activeAction === "transparent" ? (
                        <>
                          <option value="User">User</option>
                          <option value="GuideConsole">GuideConsole</option>
                          <option value="OpsScreen">OpsScreen</option>
                        </>
                      ) : (
                        <>
                          <option value="all">全园广播</option>
                          <option value="jiulong">九龙灌浴</option>
                          <option value="entrance">入口广场</option>
                          <option value="service">游客服务中心</option>
                        </>
                      )}
                    </select>
                  </label>

                  <label className={`grid gap-2 ${activeAction === "transparent" ? "opacity-50" : ""}`}>
                    <span className="text-sm font-semibold text-[#d6e6e3]">优先级</span>
                    <select
                      className="min-h-11 rounded-xl border border-white/10 bg-[#0d1b1e] px-3 text-sm text-[#eef8f6] outline-none transition focus:border-[#35d7c7]/55"
                      disabled={activeAction === "transparent"}
                      onChange={(event) => setDraftPriority(event.target.value)}
                      value={draftPriority}
                    >
                      <option value="normal">普通</option>
                      <option value="high">较高</option>
                      <option value="urgent">紧急</option>
                    </select>
                  </label>
                </div>

                {draftError ? <div className="rounded-xl border border-[#ff6b5f]/25 bg-[#ff6b5f]/12 px-3 py-2 text-sm text-[#ffaaa3]">{draftError}</div> : null}
                <div className={`rounded-xl px-3 py-2 text-sm ${lastAction.tone === "danger" ? "bg-[#ff6b5f]/12 text-[#ffaaa3]" : "bg-white/[0.055] text-[#9fb8b4]"}`}>
                  {busyAction ? `${busyAction}处理中...` : lastAction.text}
                </div>
              </div>

              <div className="grid gap-3 border-t border-white/10 p-5 sm:grid-cols-[1fr_1.4fr]">
                <button
                  className="min-h-11 rounded-xl border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-[#d6e6e3] transition hover:bg-white/[0.09] active:translate-y-px"
                  disabled={Boolean(busyAction)}
                  onClick={closeAvatarAction}
                  type="button"
                >
                  取消
                </button>
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#35d7c7] px-4 text-sm font-semibold text-[#071112] transition hover:bg-[#6de9df] active:translate-y-px disabled:cursor-wait disabled:opacity-60"
                  disabled={Boolean(busyAction)}
                  type="submit"
                >
                  <Send size={16} /> {busyAction ? "提交中" : activeAction === "transparent" ? "发送透传" : "创建播报"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AnimatedSection>
  );
}
