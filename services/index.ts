// scenic-dh 统一 API 网关 → business-api (:8001)
const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8001'

interface SpotSummary {
  id: string
  name: string
  category: string
  location: string
  shortIntro: string
  heroGradient: string
}

interface SpotDetail extends SpotSummary {
  params: string
  fullIntro: string
  highlights: string[]
  openInfo: string
  source: string
  related: string[]
}

interface RouteStep {
  spot: string
  duration: string
  note: string
  spotId?: string
}

interface RouteData {
  id: string
  title: string
  description: string
  duration: string
  distance: string
  difficulty: string
  difficultyColor: string
  steps: RouteStep[]
  highlights: string[]
  tags: string[]
}

interface ChatResponse {
  answer: string
  source: string
  confidence: 'high' | 'medium' | 'low'
}

interface RagContext {
  chunk_id: string
  text: string
  score: number
  source_name: string
  domain: string
  spot_id: string
}

interface RagResponse {
  answerable: boolean
  contexts: RagContext[]
  citations: { chunk_id: string; quote: string; score: number; source_name: string }[]
  safe_reply: string | null
  disclaimer: string | null
  latency_ms: number
}

interface AnalyticsData {
  todayVisitors: number
  weekTrend: number[]
  hourlyDistribution: { hour: string; count: number }[]
  spotPopularity: { name: string; visitors: number; avgStay: number }[]
  deviceDistribution: { name: string; value: number }[]
  facilityStatus: { name: string; status: string; load: number }[]
  alerts: { level: string; text: string; time: string }[]
}

// ═══════════════════════════════════════
// 统一请求：自动解包 {code, data, trace_id}
// ═══════════════════════════════════════
let backendAvailable: boolean | null = null

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  if (backendAvailable === false) return null
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) return null
    backendAvailable = true
    const body = await res.json()
    // 统一解包：{code: 0, message: "success", data: ..., trace_id: "..."}
    if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
      return body.data as T
    }
    // fallback: 旧格式直接返回
    return body as T
  } catch {
    backendAvailable = false
    return null
  }
}

// ═══════════════════════════════════════
// C端接口
// ═══════════════════════════════════════

export async function fetchSpots(): Promise<SpotSummary[] | null> {
  return apiFetch<SpotSummary[]>('/v1/spots')
}

export async function fetchSpot(id: string): Promise<SpotDetail | null> {
  return apiFetch<SpotDetail>(`/v1/spots/${id}`)
}

export async function fetchSpotGuide(id: string): Promise<{ shortText: string; briefText: string; longText: string; fallbackText: string } | null> {
  return apiFetch(`/v1/spots/${id}/guide`)
}

export async function fetchRoutes(): Promise<RouteData[] | null> {
  return apiFetch<RouteData[]>('/v1/routes')
}

export async function fetchRoute(id: string): Promise<RouteData | null> {
  return apiFetch<RouteData>(`/v1/routes/${id}`)
}

export async function fetchRelatedSpots(id: string): Promise<SpotSummary[] | null> {
  // 通过 tag 过滤返回同类型景点
  const spot = await fetchSpot(id)
  if (!spot) return null
  const all = await fetchSpots()
  if (!all) return null
  // 排除自身，取前 4 个
  return all.filter((s: any) => s.id !== id).slice(0, 4)
}

// ═══════════════════════════════════════
// RAG 检索（通过 business-api 代理 → RAG :5010）
// ═══════════════════════════════════════
export async function fetchRagQuery(query: string, topK: number = 5): Promise<RagResponse | null> {
  return apiFetch<RagResponse>('/v1/rag/query', {
    method: 'POST',
    body: JSON.stringify({ query, top_k: topK }),
  })
}

// 兼容旧 chat 接口：转为 RAG 查询
export async function fetchChatAnswer(question: string): Promise<ChatResponse | null> {
  const rag = await fetchRagQuery(question)
  if (!rag || !rag.answerable) {
    return rag ? {
      answer: rag.safe_reply || '抱歉，我暂时无法回答这个问题。',
      source: 'fallback',
      confidence: 'low',
    } : null
  }
  return {
    answer: rag.contexts?.[0]?.text || (rag.safe_reply ?? '抱歉，没有找到相关信息。'),
    source: rag.contexts?.[0]?.source_name || '知识库',
    confidence: rag.contexts?.[0]?.score >= 0.6 ? 'high' : 'medium',
  }
}

// ═══════════════════════════════════════
// B端接口
// ═══════════════════════════════════════
export async function fetchAnalytics(): Promise<AnalyticsData | null> {
  return apiFetch<AnalyticsData>('/v1/analytics/overview')
}

export function isBackendAvailable(): boolean | null {
  return backendAvailable
}
