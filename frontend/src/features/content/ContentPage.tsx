import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Clock3, Database, Filter, History, Plus, Search, CheckCircle2, RotateCcw, Trash2, Pencil, Upload, X, Send, FileText } from "lucide-react";
import { Flip } from "gsap/Flip";
import { gsap } from "gsap";
import { AnimatedSection } from "../../components/motion/AnimatedSection";
import { PageHeader } from "../../components/layout/PageHeader";
import { Panel } from "../../components/ui/Panel";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { approvalSteps, contentItems, contentMenu } from "../../data/operations";
import { cn } from "../../lib/cn";
import { useAdminData } from "../../hooks/useAdminData";
import { useConsoleStore } from "../../store/useConsoleStore";

gsap.registerPlugin(Flip);

const filters = ["全部", "待审核", "已发布", "知识缺口"];
type OaAction = "create" | "import" | "edit" | "rollback" | "adopt" | "resolve";
type OaFeedback = {
  title: string;
  detail: string;
  tone: "success" | "warning" | "danger" | "neutral" | "accent";
};

const actionCopy: Record<OaAction, { title: string; submit: string; tone: string }> = {
  create: { title: "新增内容", submit: "提交入库", tone: "登记为新的知识来源，后端写入审计并进入重建队列。" },
  import: { title: "导入来源", submit: "开始导入", tone: "支持 URL、文件路径或第三方素材来源，当前接入知识来源登记接口。" },
  edit: { title: "编辑内容", submit: "提交修订", tone: "保留当前版本，提交修订来源，后续可替换为内容 PATCH 接口。" },
  rollback: { title: "回滚版本", submit: "确认回滚", tone: "提交回滚 reason 并触发知识库重建，避免前端静默改状态。" },
  adopt: { title: "采纳问答", submit: "确认采纳", tone: "使用后端消息 ID 调用采纳接口，采纳后进入知识治理流程。" },
  resolve: { title: "标记处理", submit: "标记已处理", tone: "使用后端知识缺口 ID 更新处理状态，避免前端静默改展示。" }
};

function readStringId(value: unknown) {
  return typeof value === "object" && value !== null && "id" in value && typeof value.id === "string" ? value.id : "";
}

export function ContentPage() {
  const { snapshot, busyAction, lastAction, actions } = useAdminData();
  const selectedContentId = useConsoleStore((state) => state.selectedContentId);
  const setSelectedContentId = useConsoleStore((state) => state.setSelectedContentId);
  const setActivePage = useConsoleStore((state) => state.setActivePage);
  const [activeMenu, setActiveMenu] = useState(contentMenu[0].label);
  const [activeFilter, setActiveFilter] = useState("全部");
  const [query, setQuery] = useState("");
  const [detailTab, setDetailTab] = useState("基础信息");
  const [activeAction, setActiveAction] = useState<OaAction | null>(null);
  const [draft, setDraft] = useState({ title: "", source: "", channel: "", note: "" });
  const [draftError, setDraftError] = useState("");
  const [oaFeedback, setOaFeedback] = useState<OaFeedback>({
    title: "OA 工作台就绪",
    detail: "内容对象、来源入库、发布记录、审核中心和审计日志均已接入可操作入口。",
    tone: "success"
  });
  const tableRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(
    () =>
      contentItems.filter((item) => {
        const matchFilter = activeFilter === "全部" || item.status === activeFilter || (activeFilter === "知识缺口" && item.type.includes("导览"));
        const matchQuery = !query || `${item.title}${item.type}${item.owner}${item.id}`.toLowerCase().includes(query.toLowerCase());
        return matchFilter && matchQuery;
      }),
    [activeFilter, query]
  );
  const selected = contentItems.find((item) => item.id === selectedContentId) ?? filteredItems[0] ?? contentItems[0];
  const defaultMessageId = useMemo(() => readStringId(snapshot.messages?.[0]) || "MSG-001", [snapshot.messages]);
  const defaultGapId = useMemo(() => {
    const openGap = snapshot.dataGaps?.find((item) => typeof item === "object" && item !== null && "status" in item && item.status !== "resolved");
    return readStringId(openGap) || "GAP-001";
  }, [snapshot.dataGaps]);
  const publishedCount = contentItems.filter((item) => item.status === "已发布").length;
  const reviewCount = contentItems.filter((item) => item.status === "待审核").length;
  const backendMessageCount = snapshot.messages?.length ?? 0;
  const backendGapCount = snapshot.dataGaps?.length ?? 0;

  useEffect(() => {
    if (!activeAction) return;
    const drawer = document.querySelector("[data-oa-drawer]");
    if (!drawer) return;
    gsap.fromTo(drawer, { opacity: 0, x: 28 }, { opacity: 1, x: 0, duration: 0.28, ease: "power3.out" });
  }, [activeAction]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo("[data-content-row]", { opacity: 0.72, y: 8 }, { opacity: 1, y: 0, duration: 0.24, stagger: 0.018, ease: "power2.out" });
    gsap.fromTo("[data-oa-feedback]", { opacity: 0.65, y: -6 }, { opacity: 1, y: 0, duration: 0.26, ease: "power2.out" });
  }, [activeFilter, query, oaFeedback.title]);

  const selectRow = (id: string) => {
    const state = tableRef.current ? Flip.getState(tableRef.current.querySelectorAll("[data-content-row]")) : null;
    setSelectedContentId(id);
    window.requestAnimationFrame(() => {
      if (state) Flip.from(state, { duration: 0.32, ease: "power3.out", absolute: false });
    });
  };

  const openAction = (action: OaAction, target = selected) => {
    setActiveAction(action);
    setDraftError("");
    setDraft({
      title: action === "create" || action === "import" ? "" : target.title,
      source: action === "import" ? "" : action === "adopt" ? defaultMessageId : action === "resolve" ? defaultGapId : target.id,
      channel: target.channels,
      note:
        action === "rollback"
          ? `回滚 ${target.title} 至 ${target.version}`
          : action === "adopt"
            ? `采纳问答并关联到「${target.title}」`
            : action === "resolve"
              ? `处理与「${target.title}」相关的知识缺口`
              : target.description
    });
  };

  const handleMenuAction = (item: (typeof contentMenu)[number]) => {
    setActiveMenu(item.label);
    if (item.id === "filter") {
      setActiveFilter("全部");
      setQuery("");
      setOaFeedback({ title: "内容对象已重置", detail: "已恢复全部内容列表，并清空搜索条件。", tone: "success" });
    }
    if (item.id === "create") {
      setOaFeedback({ title: "来源入库已打开", detail: "可登记 URL、文件路径或第三方素材来源，并进入知识源登记接口。", tone: "accent" });
      openAction("import");
    }
    if (item.id === "broadcast") {
      setActiveFilter("已发布");
      setQuery("");
      setOaFeedback({ title: "发布记录筛选完成", detail: `当前展示 ${publishedCount} 条已发布内容。`, tone: "success" });
    }
    if (item.id === "avatar") {
      setOaFeedback({ title: "切换角色权限", detail: "进入数字人页面继续处理角色、播报和透传能力。", tone: "accent" });
      setActivePage("avatar");
    }
    if (item.id === "work-order") {
      setActiveFilter("待审核");
      setQuery("");
      setOaFeedback({ title: "审核中心已筛选", detail: `当前待审核内容 ${reviewCount} 条。`, tone: reviewCount ? "warning" : "success" });
    }
    if (item.id === "refresh") {
      setOaFeedback({ title: "审计日志刷新中", detail: `已请求后端日志与消息快照，当前消息 ${backendMessageCount} 条。`, tone: "neutral" });
      void actions.refresh();
    }
    if (item.id === "queue") {
      setActiveFilter("全部");
      setQuery("票");
      setOaFeedback({ title: "票务口径已定位", detail: "搜索条件已切换为票务内容，便于核对游客端和数字人口径。", tone: "accent" });
    }
    if (item.id === "traffic") {
      setActiveFilter("全部");
      setQuery("景区");
      setOaFeedback({ title: "点位内容已定位", detail: "搜索条件已切换为景区点位内容，便于维护地图与导览文案。", tone: "accent" });
    }
  };

  const submitAction = async () => {
    if (!activeAction) return;
    const title = draft.title.trim() || selected.title;
    const source = draft.source.trim();
    const note = draft.note.trim();
    const filePath = [source, draft.channel.trim(), note].filter(Boolean).join(" | ");
    if ((activeAction === "adopt" || activeAction === "resolve") && !source) {
      setDraftError(activeAction === "adopt" ? "缺少后端消息 ID，无法采纳。" : "缺少后端知识缺口 ID，无法标记处理。");
      return;
    }

    let ok = false;
    if (activeAction === "rollback") {
      ok = await actions.reindexKnowledge(`rollback:${selected.id}:${selected.version}:${note || "manual"}`, "回滚版本");
    } else if (activeAction === "adopt") {
      ok = await actions.adoptMessage(source);
    } else if (activeAction === "resolve") {
      ok = await actions.resolveDataGap(source);
    } else {
      const sourceType = activeAction === "import" ? (source.startsWith("http") ? "url" : "external_file") : activeAction === "edit" ? "content_revision" : "manual_content";
      ok = await actions.registerKnowledgeSource({ sourceName: title, sourceType, filePath }, actionCopy[activeAction].submit);
    }
    if (ok) {
      setOaFeedback({
        title: `${actionCopy[activeAction].submit}已提交`,
        detail: `${title} 已进入后端动作链路，来源：${source || selected.id}。`,
        tone: activeAction === "rollback" ? "warning" : "success"
      });
      setActiveAction(null);
    }
  };

  return (
    <AnimatedSection className="oa-light">
      <PageHeader
        index="04"
        title="内容治理"
        description="面向数字人话术、知识缺口、广播内容和审计记录的 OA 工作台，所有关键操作均预留后端动作。"
        actions={
          <>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-3 text-sm text-[#d6e6e3] transition hover:bg-white/[0.085] active:translate-y-px"
              onClick={() => setActiveFilter(activeFilter === "全部" ? "待审核" : "全部")}
              type="button"
            >
              <Filter size={16} /> 筛选
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#35d7c7] px-3 text-sm font-semibold text-[#071112] transition active:translate-y-px"
              onClick={() => openAction("create")}
              type="button"
            >
              <Plus size={16} /> 新增内容
            </button>
          </>
        }
      />

      <div className="motion-item mb-4 grid gap-3 xl:grid-cols-[1fr_320px]">
        <div className="grid gap-3 rounded-2xl border border-[#dfe5e1] bg-white/78 p-3 shadow-[0_18px_42px_rgba(20,35,32,.08)] md:grid-cols-4">
          {[
            { icon: Database, label: "内容总量", value: String(contentItems.length), note: `当前命中 ${filteredItems.length}` },
            { icon: Clock3, label: "待审核", value: String(reviewCount), note: activeFilter === "待审核" ? "正在查看" : "可一键筛选" },
            { icon: History, label: "后端消息", value: String(backendMessageCount), note: defaultMessageId },
            { icon: Activity, label: "知识缺口", value: String(backendGapCount), note: defaultGapId }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article className="flex min-w-0 items-center gap-3 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 py-3" key={item.label}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0f6857]/10 text-[#0f6857]">
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <small className="block truncate text-xs text-[#71807d]">{item.label}</small>
                  <strong className="block font-mono text-xl text-[#1f2928]">{item.value}</strong>
                  <small className="block truncate text-xs text-[#8b9693]">{item.note}</small>
                </span>
              </article>
            );
          })}
        </div>
        <div data-oa-feedback className="rounded-2xl border border-[#35d7c7]/16 bg-[#35d7c7]/8 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-[#8df0e5]">操作回执</span>
            <StatusBadge tone={oaFeedback.tone}>{activeMenu}</StatusBadge>
          </div>
          <strong className="block text-base text-white">{oaFeedback.title}</strong>
          <p className="mt-1 text-sm leading-6 text-[#9fb8b4]">{oaFeedback.detail}</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[230px_minmax(0,1.35fr)_380px] 2xl:grid-cols-[230px_minmax(0,1.25fr)_380px_300px]">
        <Panel className="motion-item" dark>
          <h2 className="mb-4 text-base font-bold">管理菜单</h2>
          <div className="grid gap-2">
            {contentMenu.map((item) => {
              const Icon = item.icon;
              const isActive = item.label === activeMenu;
              return (
                <button
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm transition active:translate-y-px",
                    isActive ? "bg-[#35d7c7] font-semibold text-[#071112]" : "border border-white/10 bg-white/[0.04] text-[#9fb8b4] hover:bg-white/[0.075]"
                  )}
                  key={item.label}
                  onClick={() => handleMenuAction(item)}
                  type="button"
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel className="motion-item min-w-0 overflow-hidden" dark>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#35d7c7] px-3 text-sm font-semibold text-[#071112]" onClick={() => openAction("create")} type="button">
                <Plus size={15} /> 新增内容
              </button>
              <button className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-3 text-sm text-[#d6e6e3]" onClick={() => openAction("import")} type="button">
                <Upload size={15} /> 导入
              </button>
              {filters.map((filter) => (
                <button
                  className={cn(
                    "min-h-10 rounded-xl border px-3 text-sm transition active:translate-y-px",
                    activeFilter === filter ? "border-[#35d7c7]/40 bg-[#35d7c7]/12 text-[#8df0e5]" : "border-white/10 bg-white/[0.045] text-[#9fb8b4]"
                  )}
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  type="button"
                >
                  {filter}
                </button>
              ))}
            </div>
            <label className="flex min-h-10 min-w-[240px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-3 text-[#9fb8b4]">
              <Search size={16} />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索标题 / ID / 负责人"
                value={query}
              />
            </label>
          </div>

          <div className="overflow-x-auto" ref={tableRef}>
            <table className="w-full min-w-[620px] border-separate border-spacing-y-2 text-left">
              <thead className="text-xs text-[#9fb8b4]">
                <tr>
                  {["标题", "类型", "状态", "版本", "更新人 / 时间", "操作"].map((head) => (
                    <th className="px-3 pb-1 font-medium" key={head}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    className={cn(
                      "cursor-pointer text-sm transition",
                      item.id === selected.id ? "bg-[#35d7c7]/12 text-white" : "bg-white/[0.045] text-[#d6e6e3] hover:bg-white/[0.075]"
                    )}
                    data-content-row
                    key={item.id}
                    onClick={() => selectRow(item.id)}
                  >
                    <td className="rounded-l-xl px-3 py-3 font-semibold">{item.title}</td>
                    <td className="px-3 py-3 text-[#9fb8b4]">{item.type}</td>
                    <td className="px-3 py-3"><StatusBadge tone={item.priority}>{item.status}</StatusBadge></td>
                    <td className="px-3 py-3 text-[#9fb8b4]">{item.version}</td>
                    <td className="px-3 py-3"><span>{item.owner}</span><small className="block text-xs text-[#9fb8b4]">{item.updatedAt}</small></td>
                    <td className="rounded-r-xl px-3 py-3">
                      <button
                        className="min-h-9 rounded-lg border border-[#35d7c7]/20 px-3 text-xs font-semibold text-[#8df0e5] transition hover:bg-[#35d7c7]/10 active:translate-y-px"
                        onClick={(event) => {
                          event.stopPropagation();
                          selectRow(item.id);
                          openAction("edit", item);
                        }}
                        type="button"
                      >
                        编辑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="motion-item xl:col-span-1" dark>
          <h2 className="mb-4 text-base font-bold">内容详情</h2>
          <div className="mb-4 flex gap-4 border-b border-white/10 text-sm">
            {["基础信息", "权限范围", "版本记录"].map((tab) => (
              <button
                className={detailTab === tab ? "border-b-2 border-[#35d7c7] pb-2 font-semibold text-[#8df0e5]" : "pb-2 text-[#9fb8b4]"}
                key={tab}
                onClick={() => setDetailTab(tab)}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="grid gap-3">
            {[
              ["标题", selected.title],
              ["类型", selected.type],
              ["生效渠道", selected.channels],
              ["游客端展示范围", selected.scope],
              ["版本", selected.version],
              ["状态", selected.status],
              ["更新人", selected.owner],
              ["更新时间", selected.updatedAt],
              ["描述", selected.description]
            ].map(([label, value]) => (
              <div className="grid grid-cols-[100px_1fr] gap-3 text-sm" key={label}>
                <span className="text-[#9fb8b4]">{label}</span>
                <strong className="font-medium leading-6">{value}</strong>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#35d7c7] px-4 text-sm font-semibold text-[#071112]" onClick={() => openAction("adopt")} type="button">
              <CheckCircle2 size={15} /> 采纳
            </button>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-4 text-sm" onClick={() => openAction("edit")} type="button">
              <Pencil size={15} /> 编辑
            </button>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-300/25 px-4 text-sm text-[#ffaaa3]" onClick={() => openAction("resolve")} type="button">
              <Trash2 size={15} /> 标记处理
            </button>
          </div>
          <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${lastAction.tone === "danger" ? "bg-[#ff6b5f]/12 text-[#ffaaa3]" : "bg-white/[0.05] text-[#9fb8b4]"}`}>
            {busyAction ? `${busyAction}处理中...` : lastAction.text}
          </div>
        </Panel>

        <Panel className="motion-item min-w-0 xl:col-span-3 2xl:col-span-1" dark>
          <h2 className="mb-4 text-base font-bold">审批过程</h2>
          <div className="grid gap-4">
            {approvalSteps.map((step) => (
              <article className="relative pl-6" key={step.title}>
                <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-[#35d7c7] ring-4 ring-[#35d7c7]/12" />
                <strong className="block text-sm">{step.title}</strong>
                <small className="mt-1 block text-xs leading-5 text-[#9fb8b4]">{step.note}</small>
              </article>
            ))}
          </div>
          <button
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#f0b84d]/24 bg-[#f0b84d]/12 text-sm font-semibold text-[#ffd787]"
            onClick={() => openAction("rollback")}
            type="button"
          >
            <RotateCcw size={16} /> 回滚版本
          </button>
        </Panel>
      </div>

      {activeAction && (
        <div className="fixed inset-0 z-50 bg-[#1f2928]/20 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={actionCopy[activeAction].title}>
          <button className="absolute inset-0 h-full w-full cursor-default" disabled={Boolean(busyAction)} onClick={() => setActiveAction(null)} type="button" aria-label="关闭操作面板" />
          <aside
            className="absolute bottom-3 right-3 top-3 flex w-[min(460px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-[#dfe5e1] bg-white shadow-2xl shadow-black/15"
            data-oa-drawer
          >
            <header className="flex items-start justify-between border-b border-[#dfe5e1] bg-[#f7f8f6] px-5 py-4">
              <div>
                <div className="mb-2 inline-flex min-h-7 items-center gap-2 rounded-full border border-[#0f6857]/20 bg-[#0f6857]/10 px-3 text-xs font-semibold text-[#0f6857]">
                  <FileText size={14} /> OA 操作
                </div>
                <h2 className="text-xl font-bold text-[#26302e]">{actionCopy[activeAction].title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#71807d]">{actionCopy[activeAction].tone}</p>
              </div>
              <button
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-[#dfe5e1] bg-white text-[#52615e] transition hover:bg-[#eef3f0] active:translate-y-px"
                onClick={() => setActiveAction(null)}
                type="button"
                aria-label="关闭"
              >
                <X size={17} />
              </button>
            </header>

            <form
              className="grid flex-1 content-start gap-4 overflow-y-auto px-5 py-5"
              onSubmit={(event) => {
                event.preventDefault();
                void submitAction();
              }}
            >
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[#26302e]">{activeAction === "rollback" ? "回滚对象" : activeAction === "adopt" ? "采纳对象" : activeAction === "resolve" ? "处理对象" : "内容标题"}</span>
                <input
                  className="min-h-11 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 text-sm text-[#26302e] outline-none transition focus:border-[#0f6857]/45"
                  disabled={activeAction === "rollback" || activeAction === "adopt" || activeAction === "resolve"}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, title: event.target.value }));
                    if (draftError) setDraftError("");
                  }}
                  placeholder="输入内容标题"
                  value={draft.title}
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[#26302e]">{activeAction === "import" ? "来源 URL / 文件路径" : activeAction === "adopt" ? "后端消息 ID" : activeAction === "resolve" ? "知识缺口 ID" : "来源标识"}</span>
                <input
                  className="min-h-11 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 text-sm text-[#26302e] outline-none transition focus:border-[#0f6857]/45"
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, source: event.target.value }));
                    if (draftError) setDraftError("");
                  }}
                  placeholder={activeAction === "import" ? "https://... 或 /materials/file.md" : "来源 ID"}
                  value={draft.source}
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[#26302e]">生效渠道</span>
                <input
                  className="min-h-11 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 text-sm text-[#26302e] outline-none transition focus:border-[#0f6857]/45"
                  disabled={activeAction === "adopt" || activeAction === "resolve"}
                  onChange={(event) => setDraft((current) => ({ ...current, channel: event.target.value }))}
                  placeholder="游客端、数字人、大屏"
                  value={draft.channel}
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[#26302e]">{activeAction === "rollback" ? "回滚原因" : "处理备注"}</span>
                <textarea
                  className="min-h-[132px] resize-none rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 py-3 text-sm leading-6 text-[#26302e] outline-none transition focus:border-[#0f6857]/45"
                  onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
                  placeholder="写明本次操作的业务原因，便于后续审计。"
                  value={draft.note}
                />
              </label>

              {draftError ? <div className="rounded-xl border border-[#ff6b5f]/25 bg-[#ff6b5f]/12 px-3 py-2 text-sm text-[#ffaaa3]">{draftError}</div> : null}

              <div className={`rounded-xl px-3 py-3 text-xs leading-5 ${lastAction.tone === "danger" ? "bg-[#ff6b5f]/12 text-[#b94038]" : "bg-[#f7f8f6] text-[#71807d]"}`}>
                {busyAction ? `${busyAction}处理中...` : lastAction.text}
              </div>

              <div className="mt-1 grid grid-cols-2 gap-3">
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] text-sm font-semibold text-[#52615e] transition hover:bg-[#eef3f0] active:translate-y-px"
                  onClick={() => setActiveAction(null)}
                  type="button"
                >
                  取消
                </button>
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0f6857] text-sm font-semibold text-white transition hover:bg-[#1d4e43] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={Boolean(busyAction)}
                  type="submit"
                >
                  <Send size={16} /> {busyAction ? "提交中" : actionCopy[activeAction].submit}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </AnimatedSection>
  );
}
