import { lazy, Suspense, useState } from "react";
import { Bell, Layers, Maximize2, Radio, RefreshCw, Sparkles, UsersRound } from "lucide-react";
import { AnimatedSection } from "../../components/motion/AnimatedSection";
import { PageHeader } from "../../components/layout/PageHeader";
import { Panel } from "../../components/ui/Panel";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { mapPoints, quickActions } from "../../data/operations";
import { useAdminData } from "../../hooks/useAdminData";
import { useConsoleStore } from "../../store/useConsoleStore";
import type { MapPoint } from "../../types/domain";
import terrainUrl from "../../assets/sc-datav/sc_map.png";
import { RoadNetworkOverlay } from "./components/RoadNetworkOverlay";
import { MapPointOverlay } from "./components/MapPointOverlay";

const ScenicMapScene = lazy(() => import("./components/ScenicMapScene").then((module) => ({ default: module.ScenicMapScene })));

const layerLabels: Record<MapPoint["layer"], string> = {
  crowd: "客流",
  device: "设备",
  broadcast: "广播",
  alert: "告警"
};

type MapActionState = {
  title: string;
  detail: string;
  tone: MapPoint["tone"];
};

export function OverviewPage() {
  const { snapshot, connected, loading, updatedAt, busyAction, lastAction, actions } = useAdminData();
  const setActivePage = useConsoleStore((state) => state.setActivePage);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint>(mapPoints[0]);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Record<MapPoint["layer"], boolean>>({
    crowd: true,
    device: true,
    broadcast: true,
    alert: true
  });
  const [mapAction, setMapAction] = useState<MapActionState>({
    title: "地图态势已就绪",
    detail: "真实 OSM 图层、点位和告警覆盖已加载，可直接聚焦点位或切换图层。",
    tone: "success"
  });

  const focusAbnormalPoint = () => {
    const dangerPoint = mapPoints.find((point) => point.tone === "danger") ?? mapPoints[0];
    setActiveLayers((value) => ({ ...value, alert: true, device: true }));
    setSelectedPoint(dangerPoint);
    setMapAction({
      title: "已聚焦异常点位",
      detail: `${dangerPoint.name} 已选中，告警与设备图层保持可见。`,
      tone: dangerPoint.tone
    });
  };

  const handleQuickAction = (id: string) => {
    if (id === "broadcast") {
      const priority = selectedPoint.tone === "danger" ? "urgent" : selectedPoint.tone === "warning" ? "high" : "normal";
      const text = `空间态势广播：${selectedPoint.name}，${selectedPoint.summary}。请现场运营人员关注该点位状态，及时引导游客并保持通道畅通。`;
      setMapAction({
        title: "广播任务已提交",
        detail: `目标点位：${selectedPoint.name}，优先级：${priority}。`,
        tone: selectedPoint.tone
      });
      void actions.createBroadcast(text, { target: selectedPoint.id, priority });
    }
    if (id === "avatar") {
      setMapAction({ title: "进入数字人接管", detail: "正在切换到数字人运行页，继续处理播报与透传任务。", tone: "accent" });
      setActivePage("avatar");
    }
    if (id === "queue") {
      const point = mapPoints.find((item) => item.layer === "crowd" && item.tone === "warning") ?? mapPoints[0];
      setActiveLayers((value) => ({ ...value, crowd: true }));
      setSelectedPoint(point);
      setMapAction({ title: "已切到排队调度", detail: `${point.name} 已选中，正在刷新实时排队数据。`, tone: point.tone });
      void actions.refresh();
    }
    if (id === "traffic") {
      const point = mapPoints.find((item) => item.layer === "crowd") ?? mapPoints[0];
      setActiveLayers((value) => ({ ...value, crowd: true }));
      setSelectedPoint(point);
      setMapAction({ title: "客流监测已刷新", detail: `${point.name} 作为当前客流观察点。`, tone: point.tone });
      void actions.refresh();
    }
    if (id === "device-alert") {
      setActiveLayers((value) => ({ ...value, alert: true, device: true }));
      const point = mapPoints.find((item) => item.layer === "alert") ?? mapPoints[0];
      setSelectedPoint(point);
      setMapAction({ title: "设备告警图层已打开", detail: `${point.name} 已进入处置视图。`, tone: point.tone });
      void actions.refresh();
    }
    if (id === "work-order") {
      setMapAction({ title: "进入应急工单", detail: "正在切换到 OA 内容与工单处置页面。", tone: "warning" });
      setActivePage("content");
    }
  };

  return (
    <AnimatedSection className="min-h-[calc(100vh-132px)]">
      <PageHeader
        index="01"
        title="空间态势"
        description="基于真实 OSM 地理数据绘制景区道路、核心点位、广播覆盖和告警位置，支持图层切换与摄像机聚焦。"
        actions={
          <>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-3 text-sm text-[#d6e6e3] transition hover:bg-white/[0.085] active:translate-y-px"
              onClick={actions.refresh}
              type="button"
            >
              <RefreshCw className={loading ? "animate-spin" : ""} size={16} /> 刷新
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#35d7c7] px-3 text-sm font-semibold text-[#071112] transition active:translate-y-px"
              onClick={focusAbnormalPoint}
              type="button"
            >
              <Sparkles size={16} /> 聚焦异常
            </button>
          </>
        }
      />

      <div className={`motion-item overflow-hidden rounded-2xl border border-white/10 bg-[#071112] shadow-[0_28px_90px_rgba(0,0,0,.32)] ${
        mapExpanded ? "fixed inset-4 z-50 min-h-0" : "relative min-h-[540px] sm:min-h-[620px]"
      }`}
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(7,17,18,.74), rgba(7,17,18,.18) 45%, rgba(7,17,18,.28)), url(${terrainUrl})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover"
        }}
      >
        <div className="absolute inset-0">
          <Suspense fallback={<div className="grid h-full place-items-center text-sm text-[#9fb8b4]">正在加载真实地理图层</div>}>
            <ScenicMapScene activeLayers={activeLayers} onSelect={setSelectedPoint} overlayOnly points={mapPoints} selectedId={selectedPoint.id} />
          </Suspense>
        </div>
        <RoadNetworkOverlay />
        <MapPointOverlay activeLayers={activeLayers} onSelect={setSelectedPoint} points={mapPoints} selectedId={selectedPoint.id} />

        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(7,17,18,.92),transparent)]" />
        <div className="scan-line pointer-events-none absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(53,215,199,.12),transparent)]" />

        <Panel className="absolute left-3 right-3 top-[314px] z-10 sm:left-[324px] sm:right-auto sm:top-4 sm:w-[360px]" dark>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-[#9fb8b4]">操作回执</span>
            <StatusBadge tone={mapAction.tone}>{layerLabels[selectedPoint.layer]}</StatusBadge>
          </div>
          <strong className="block text-base text-white">{mapAction.title}</strong>
          <p className="mt-1 text-sm leading-6 text-[#9fb8b4]">{mapAction.detail}</p>
        </Panel>

        <Panel className="absolute left-3 right-3 top-3 z-10 max-h-[292px] overflow-y-auto sm:left-4 sm:right-auto sm:top-4 sm:max-h-none sm:w-[304px] sm:overflow-visible" dark>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold">景区运行概览</h2>
            <StatusBadge tone={connected ? "success" : "warning"}>{connected ? "已接后端" : "fallback"}</StatusBadge>
          </div>
          <div className="grid gap-2">
            {snapshot.operations.map((metric, index) => (
              <article className="grid grid-cols-[22px_1fr] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 sm:grid-cols-[22px_1fr_auto]" key={metric.label}>
                {index === 2 ? <Radio size={17} className="text-[#f0b84d]" /> : index > 2 ? <Bell size={17} className="text-[#ff8d85]" /> : <UsersRound size={17} className="text-[#7bd66f]" />}
                <div className="min-w-0">
                  <span className="block text-xs text-[#9fb8b4]">{metric.label}</span>
                  <strong className="block text-xl leading-7 text-white">{metric.value}</strong>
                </div>
                <small className="hidden text-right text-[11px] text-[#8ba5a0] sm:block">{metric.note}</small>
              </article>
            ))}
          </div>
          <div className="mt-3 text-xs text-[#8ba5a0]">
            最后更新：{updatedAt ? updatedAt.toLocaleTimeString("zh-CN", { hour12: false }) : "等待同步"}
          </div>
        </Panel>

        <Panel className="absolute bottom-4 left-4 z-10 hidden w-[304px] sm:block" dark>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">点位详情</h2>
            <StatusBadge tone={selectedPoint.tone}>{layerLabels[selectedPoint.layer]}</StatusBadge>
          </div>
          <strong className="block text-2xl">{selectedPoint.name}</strong>
          <p className="mt-2 text-sm leading-6 text-[#9fb8b4]">{selectedPoint.summary}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <span className="rounded-lg bg-white/[0.06] px-3 py-2 text-[#9fb8b4]">经度 {selectedPoint.lon.toFixed(5)}</span>
            <span className="rounded-lg bg-white/[0.06] px-3 py-2 text-[#9fb8b4]">纬度 {selectedPoint.lat.toFixed(5)}</span>
          </div>
        </Panel>

        <div className="absolute right-4 top-5 z-10 hidden gap-2 sm:grid">
          <button
            aria-label={mapExpanded ? "退出全屏地图" : "全屏地图"}
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-[#0d1b1e]/86 text-[#d6e6e3] shadow-sm backdrop-blur-xl transition hover:bg-white/10 active:translate-y-px"
            onClick={() => setMapExpanded((value) => !value)}
            type="button"
          >
            <Maximize2 size={18} />
          </button>
          <button
            aria-label="重置图层"
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-[#0d1b1e]/86 text-[#d6e6e3] shadow-sm backdrop-blur-xl transition hover:bg-white/10 active:translate-y-px"
            onClick={() => {
              setActiveLayers({ crowd: true, device: true, broadcast: true, alert: true });
              setMapAction({ title: "图层已重置", detail: "客流、设备、广播和告警图层已全部恢复显示。", tone: "success" });
            }}
            type="button"
          >
            <Layers size={18} />
          </button>
        </div>

        <Panel className="absolute bottom-4 right-4 z-10 hidden w-[320px] sm:block" dark>
          <h2 className="mb-3 text-base font-bold">图层控制</h2>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(layerLabels) as MapPoint["layer"][]).map((layer) => (
              <button
                className={`min-h-11 rounded-xl border px-3 text-sm transition active:translate-y-px ${
                  activeLayers[layer] ? "border-[#35d7c7]/40 bg-[#35d7c7]/12 text-[#8df0e5]" : "border-white/10 bg-white/[0.04] text-[#9fb8b4]"
                }`}
                key={layer}
                onClick={() => setActiveLayers((value) => ({ ...value, [layer]: !value[layer] }))}
                type="button"
              >
                {layerLabels[layer]}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-white/[0.045] p-3 text-xs text-[#9fb8b4]">
            <div className="flex items-center justify-between gap-3">
              <span>地理底图</span>
              <strong className="font-medium text-[#8df0e5]">OSM GeoJSON</strong>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>实时表达</span>
              <strong className="font-medium text-[#ffd787]">道路流动 / 点位告警</strong>
            </div>
          </div>
          <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${lastAction.tone === "danger" ? "bg-[#ff6b5f]/12 text-[#ffaaa3]" : "bg-white/[0.05] text-[#9fb8b4]"}`}>
            {busyAction ? `${busyAction}处理中...` : lastAction.text}
          </div>
        </Panel>
      </div>

      <Panel className="motion-item mt-3 sm:hidden" dark>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs text-[#9fb8b4]">当前点位</span>
            <strong className="block truncate text-lg">{selectedPoint.name}</strong>
          </div>
          <StatusBadge tone={selectedPoint.tone}>{layerLabels[selectedPoint.layer]}</StatusBadge>
        </div>
        <p className="text-sm leading-6 text-[#9fb8b4]">{selectedPoint.summary}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(Object.keys(layerLabels) as MapPoint["layer"][]).map((layer) => (
            <button
              className={`min-h-11 rounded-xl border px-3 text-sm transition active:translate-y-px ${
                activeLayers[layer] ? "border-[#35d7c7]/40 bg-[#35d7c7]/12 text-[#8df0e5]" : "border-white/10 bg-white/[0.04] text-[#9fb8b4]"
              }`}
              key={layer}
              onClick={() => setActiveLayers((value) => ({ ...value, [layer]: !value[layer] }))}
              type="button"
            >
              {layerLabels[layer]}
            </button>
          ))}
        </div>
      </Panel>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.35fr_.85fr]">
        <Panel className="motion-item">
          <h2 className="mb-3 text-base font-bold">快捷动作</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  className="grid min-h-[88px] place-items-center gap-2 rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] px-3 py-3 text-sm font-semibold text-[#26302e] transition hover:border-[#0f6857]/24 hover:bg-[#eef3f0] active:translate-y-px"
                  disabled={Boolean(busyAction)}
                  key={action.label}
                  onClick={() => handleQuickAction(action.id)}
                  type="button"
                >
                  <Icon size={22} className="text-[#0f6857]" />
                  <span>{action.label}</span>
                  <small className="text-center text-[11px] font-normal text-[#71807d]">{action.description}</small>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel className="motion-item">
          <h2 className="mb-3 text-base font-bold">待办与告警</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["工单待处理", "32", "danger"],
              ["设备告警", "8", "warning"],
              ["应急事件", "2", "danger"]
            ].map(([label, value, tone]) => (
              <article className="rounded-xl border border-[#dfe5e1] bg-[#f7f8f6] p-4" key={label}>
                <span className="text-xs text-[#71807d]">{label}</span>
                <strong className={tone === "warning" ? "mt-2 block text-2xl text-[#f0b84d]" : "mt-2 block text-2xl text-[#ff6b5f]"}>{value}</strong>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    </AnimatedSection>
  );
}
