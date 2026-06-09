import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "../services/adminApi";
import { dataMetrics, hotQuestions, operationsMetrics, queueTrend, workOrderTrend } from "../data/operations";
import type { ChartPoint, MetricItem } from "../types/domain";

interface AdminSnapshot {
  operations: MetricItem[];
  data: MetricItem[];
  queueTrend: ChartPoint[];
  workOrderTrend: ChartPoint[];
  hotQuestions: ChartPoint[];
  avatarImageUrl: string;
  avatarImageSet?: Record<string, string>;
  avatarImageSource: "runtime" | "fallback";
  runtime?: Record<string, unknown>;
  fay?: Record<string, unknown>;
  knowledge?: Record<string, unknown>;
  analytics?: Record<string, unknown>;
  broadcasts?: unknown[];
  messages?: unknown[];
  dataGaps?: unknown[];
  auditLogs?: unknown[];
}

interface ActionResult {
  tone: "success" | "danger" | "neutral";
  text: string;
}

const fallbackSnapshot: AdminSnapshot = {
  operations: operationsMetrics,
  data: dataMetrics,
  queueTrend,
  workOrderTrend,
  hotQuestions,
  avatarImageUrl: import.meta.env.VITE_AVATAR_IMAGE_URL ?? "/fay-robot/Speaking.jpg",
  avatarImageSet: {
    normal: "/fay-robot/Normal.jpg",
    speaking: "/fay-robot/Speaking.jpg",
    listening: "/fay-robot/Listening.jpg",
    thinking: "/fay-robot/Thinking.jpg"
  },
  avatarImageSource: "fallback"
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatNumber(value: unknown, fallback: string) {
  if (typeof value === "number") return value.toLocaleString("zh-CN");
  if (typeof value === "string" && value.trim()) return value;
  return fallback;
}

function readItems(payload: unknown): unknown[] {
  if (isRecord(payload) && Array.isArray(payload.items)) return payload.items;
  return [];
}

function readFirstString(records: Array<Record<string, unknown> | undefined>, keys: string[]) {
  for (const record of records) {
    if (!record) continue;
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return undefined;
}

function readAvatarImageSet(records: Array<Record<string, unknown> | undefined>) {
  for (const record of records) {
    const value = record?.avatarImageSet ?? record?.avatar_image_set ?? record?.images ?? record?.imageSet;
    if (!isRecord(value)) continue;
    const entries = Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0);
    if (entries.length) return Object.fromEntries(entries);
  }
  return undefined;
}

function readAvatarAssetBase(records: Array<Record<string, unknown> | undefined>) {
  for (const record of records) {
    const config = record?.avatarConfig ?? record?.avatar_config;
    if (!isRecord(config)) continue;
    const assetBase = config.assetBase ?? config.asset_base;
    if (typeof assetBase === "string" && assetBase.trim() && !assetBase.includes("/admin-assets")) return assetBase.replace(/\/$/, "");
  }
  return "/fay-robot";
}

function normalizeAvatarImageUrl(url: string | undefined, assetBase: string, mode = "Speaking") {
  if (!url) return undefined;
  if (url.includes("/admin-assets/avatar-preview-ref.png")) return `${assetBase}/${mode}.jpg`;
  if (url.startsWith(`${assetBase}/`) && url.endsWith(".gif")) return url.replace(/\.gif$/, ".jpg");
  return url;
}

function normalizeAvatarImageSet(imageSet: Record<string, string> | undefined, assetBase: string) {
  return {
    normal: normalizeAvatarImageUrl(imageSet?.normal, assetBase, "Normal") ?? `${assetBase}/Normal.jpg`,
    speaking: normalizeAvatarImageUrl(imageSet?.speaking, assetBase, "Speaking") ?? `${assetBase}/Speaking.jpg`,
    listening: normalizeAvatarImageUrl(imageSet?.listening, assetBase, "Listening") ?? `${assetBase}/Listening.jpg`,
    thinking: normalizeAvatarImageUrl(imageSet?.thinking, assetBase, "Thinking") ?? `${assetBase}/Thinking.jpg`
  };
}

function metricFromAnalytics(analytics: unknown): MetricItem[] {
  if (!isRecord(analytics)) return dataMetrics;
  return [
    { label: "今日会话", value: formatNumber(analytics.sessionsToday, dataMetrics[0].value), note: "后台实时", tone: "success" },
    { label: "知识命中率", value: formatNumber(analytics.knowledgeHitRate, dataMetrics[4].value), note: "RAG 引用", tone: "success" },
    { label: "未解决问题", value: formatNumber(analytics.unresolvedQuestions, dataMetrics[5].value), note: "需内容治理", tone: "warning" },
    { label: "平均响应", value: formatNumber(analytics.avgLatency, "1.8s"), note: "数字人服务", tone: "neutral" },
    { label: "广播触达", value: formatNumber(analytics.broadcastReach, "91.4%"), note: "核心点位", tone: "success" },
    { label: "异常日志", value: formatNumber(analytics.alertCount, "8"), note: "最近 24 小时", tone: "danger" }
  ];
}

export function useAdminData() {
  const [snapshot, setSnapshot] = useState<AdminSnapshot>(fallbackSnapshot);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<ActionResult>({ tone: "neutral", text: "等待操作" });
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      adminApi.getRuntimeStatus(),
      adminApi.getKnowledgeStatus(),
      adminApi.getAnalyticsOverview(),
      adminApi.getHotQuestions(),
      adminApi.getRagAnalytics(),
      adminApi.getAvatarAnalytics(),
      adminApi.getBroadcasts(),
      adminApi.getDataGaps(),
      adminApi.getAuditLogs(),
      adminApi.getAuditMessages(),
      adminApi.getFaySystemStatus()
    ]);

    const [runtime, knowledge, analytics, hot, rag, avatar, broadcasts, dataGaps, auditLogs, messages, fay] = results.map((result) =>
      result.status === "fulfilled" ? result.value : undefined
    );
    const hasBackend = results.some((result) => result.status === "fulfilled");
    const ragRecord = isRecord(rag) ? (rag as Record<string, unknown>) : undefined;
    const avatarRecord = isRecord(avatar) ? (avatar as Record<string, unknown>) : undefined;
    const runtimeAvatarImage = readFirstString(
      [isRecord(runtime) ? runtime : undefined, isRecord(fay) ? fay : undefined, avatarRecord],
      ["avatarImageUrl", "avatar_image_url", "imageUrl", "portraitUrl", "figureUrl", "avatarUrl", "avatar_url"]
    );
    const runtimeAvatarImageSet = readAvatarImageSet([isRecord(runtime) ? runtime : undefined, isRecord(fay) ? fay : undefined, avatarRecord]);
    const avatarAssetBase = readAvatarAssetBase([isRecord(runtime) ? runtime : undefined, isRecord(fay) ? fay : undefined, avatarRecord]);
    const normalizedAvatarImageSet = normalizeAvatarImageSet(runtimeAvatarImageSet, avatarAssetBase);
    const normalizedAvatarImage = normalizeAvatarImageUrl(runtimeAvatarImage, avatarAssetBase);

    setConnected(hasBackend);
    setSnapshot({
      ...fallbackSnapshot,
      runtime: isRecord(runtime) ? runtime : undefined,
      knowledge: isRecord(knowledge) ? knowledge : undefined,
      analytics: isRecord(analytics) ? analytics : undefined,
      fay: isRecord(fay) ? fay : undefined,
      avatarImageUrl: normalizedAvatarImage ?? normalizedAvatarImageSet.speaking ?? fallbackSnapshot.avatarImageUrl,
      avatarImageSet: normalizedAvatarImageSet,
      avatarImageSource: runtimeAvatarImage || runtimeAvatarImageSet ? "runtime" : "fallback",
      data: metricFromAnalytics(analytics),
      hotQuestions: readItems(hot).length
        ? readItems(hot).slice(0, 5).map((item, index) => ({
            label: isRecord(item) ? String(item.question ?? item.label ?? `问题 ${index + 1}`) : `问题 ${index + 1}`,
            value: isRecord(item) && typeof item.count === "number" ? item.count : hotQuestions[index]?.value ?? 0
          }))
        : hotQuestions,
      broadcasts: readItems(broadcasts),
      dataGaps: readItems(dataGaps),
      auditLogs: readItems(auditLogs),
      messages: readItems(messages),
      operations: [
        ...operationsMetrics.slice(0, 3),
        {
          label: "知识缺口",
          value: formatNumber(ragRecord?.["gapCount"], "32"),
          note: "待治理",
          tone: "warning"
        },
        {
          label: "数字人在线",
          value: avatarRecord ? formatNumber(avatarRecord["onlineRate"], "在线") : "在线",
          note: hasBackend ? "已接入" : "fallback",
          tone: hasBackend ? "success" : "warning"
        }
      ]
    });
    setUpdatedAt(new Date());
    setLoading(false);
  }, []);

  const runAction = useCallback(async (label: string, action: () => Promise<unknown>) => {
    setBusyAction(label);
    setLastAction({ tone: "neutral", text: `${label}处理中...` });
    try {
      await action();
      setLastAction({ tone: "success", text: `${label}已提交` });
      await refresh();
      return true;
    } catch (error) {
      setLastAction({
        tone: "danger",
        text: error instanceof Error ? `${label}失败：${error.message}` : `${label}失败`
      });
      return false;
    } finally {
      setBusyAction(null);
    }
  }, [refresh]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const actions = useMemo(
    () => ({
      refresh: () => runAction("刷新数据", refresh),
      updateRuntimeConfig: (config: Record<string, string>) => runAction("保存数字人配置", () => adminApi.updateRuntimeConfig(config)),
      clearQueue: () => runAction("清空队列", adminApi.clearQueue),
      toggleMicrophone: () => runAction("切换麦克风", adminApi.toggleMicrophone),
      registerKnowledgeSource: (source: { sourceName: string; sourceType: string; filePath?: string }, label = "登记知识来源") =>
        runAction(label, () => adminApi.registerKnowledgeSource(source)),
      reindexKnowledge: (reason = "admin-console", label = "知识库重建") => runAction(label, () => adminApi.reindexKnowledge(reason)),
      createBroadcast: (text = "请各位游客留意现场广播，合理规划游览路线。", options?: { target?: string; priority?: string }) =>
        runAction("创建广播", () => adminApi.createBroadcast(text, options?.target, options?.priority)),
      startLive: () => runAction("启动数字人直播", adminApi.startFayLive),
      transparentPass: (text = "请播报当前景区欢迎语。", user = "User") => runAction("数字人透传", () => adminApi.sendFayTransparentPass(text, user)),
      adoptMessage: (messageId = "msg-demo") => runAction("采纳问答", () => adminApi.adoptMessage(messageId)),
      resolveDataGap: (gapId = "GAP-008") => runAction("标记已处理", () => adminApi.patchDataGap(gapId)),
      exportReport: () =>
        runAction("导出日报", async () => {
          const blob = new Blob([JSON.stringify({ updatedAt: new Date().toISOString(), metrics: snapshot.data }, null, 2)], {
            type: "application/json"
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "scenic-admin-report.json";
          link.click();
          URL.revokeObjectURL(url);
        })
    }),
    [refresh, runAction, snapshot.data]
  );

  return { snapshot, connected, loading, updatedAt, busyAction, lastAction, actions };
}
