interface ApiEnvelope<T> {
  code?: number;
  message?: string;
  data?: T;
  trace_id?: string;
}

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL ?? "http://127.0.0.1:8002/v1";
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN ?? "adm-dev-token";
const FAY_RUNTIME_URL = import.meta.env.VITE_FAY_RUNTIME_URL ?? "http://127.0.0.1:5000";
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_ADMIN_REQUEST_TIMEOUT_MS ?? 5000);
const FAY_STATUS_TIMEOUT_MS = Number(import.meta.env.VITE_FAY_STATUS_TIMEOUT_MS ?? 900);

function timeoutController(timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timer };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { controller, timer } = timeoutController();
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: init?.signal ?? controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        "x-admin-token": ADMIN_TOKEN,
        ...init?.headers
      }
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("后台接口请求超时");
    throw error;
  } finally {
    window.clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`后台接口 ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as ApiEnvelope<T> | T;
  if (typeof payload === "object" && payload && "data" in payload) {
    const envelope = payload as ApiEnvelope<T>;
    if (typeof envelope.code === "number" && envelope.code !== 0) {
      throw new Error(envelope.message || `后台接口错误 ${envelope.code}`);
    }
    return envelope.data as T;
  }

  return payload as T;
}

async function fayRequest<T>(path: string, init?: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const { controller, timer } = timeoutController(timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${FAY_RUNTIME_URL}${path}`, { ...init, signal: init?.signal ?? controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("Fay 运行时请求超时");
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
  if (!response.ok) {
    throw new Error(`Fay 运行时 ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export const adminApi = {
  getRuntimeStatus: () => request<Record<string, unknown>>("/runtime/status"),
  updateRuntimeConfig: (config: Record<string, string>) =>
    request<Record<string, unknown>>("/runtime/config", {
      method: "POST",
      body: JSON.stringify(config)
    }),
  toggleMicrophone: () => request<Record<string, unknown>>("/runtime/microphone/toggle", { method: "POST" }),
  clearQueue: () => request<Record<string, unknown>>("/runtime/clear-queue", { method: "POST" }),
  getKnowledgeStatus: () => request<Record<string, unknown>>("/knowledge/status"),
  registerKnowledgeSource: (source: { sourceName: string; sourceType: string; filePath?: string }) =>
    request<Record<string, unknown>>("/knowledge/sources", {
      method: "POST",
      body: JSON.stringify({ scenicId: "SA-001", ...source })
    }),
  reindexKnowledge: (reason = "admin-console") =>
    request<Record<string, unknown>>("/knowledge/reindex", {
      method: "POST",
      body: JSON.stringify({ scenicId: "SA-001", reason })
    }),
  getBroadcasts: () => request<{ items?: unknown[] }>("/broadcasts"),
  createBroadcast: (text: string, target = "all", priority = "normal") =>
    request<Record<string, unknown>>("/broadcasts", {
      method: "POST",
      body: JSON.stringify({ text, target, priority })
    }),
  getAnalyticsOverview: () => request<Record<string, unknown>>("/analytics/overview"),
  getHotQuestions: () => request<{ items?: unknown[] }>("/analytics/hot-questions"),
  getRagAnalytics: () => request<Record<string, unknown>>("/analytics/rag"),
  getAvatarAnalytics: () => request<Record<string, unknown>>("/analytics/avatar"),
  getAuditSessions: () => request<{ items?: unknown[]; total?: number }>("/sessions"),
  getAuditMessages: () => request<{ items?: unknown[]; total?: number }>("/messages"),
  adoptMessage: (messageId: string) => request<Record<string, unknown>>(`/messages/${messageId}/adopt`, { method: "POST" }),
  getAuditLogs: () => request<{ items?: unknown[]; total?: number }>("/audit-logs?limit=20"),
  getDataGaps: () => request<{ items?: unknown[]; total?: number }>("/data-gaps"),
  patchDataGap: (gapId: string, status = "resolved") =>
    request<Record<string, unknown>>(`/data-gaps/${gapId}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),
  getFaySystemStatus: (username = "User") =>
    fayRequest<Record<string, unknown>>(`/api/get-system-status?username=${encodeURIComponent(username)}`, undefined, FAY_STATUS_TIMEOUT_MS),
  startFayLive: () => fayRequest<Record<string, unknown>>("/api/start-live", { method: "POST" }),
  sendFayTransparentPass: (text: string, user = "User") =>
    fayRequest<Record<string, unknown>>("/transparent-pass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, text, queue: false })
    })
};
