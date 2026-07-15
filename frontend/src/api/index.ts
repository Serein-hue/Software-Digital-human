/** API client for scenic-dh-business-api (:8001/v1) */

const BUSINESS_BASE = import.meta.env.VITE_BUSINESS_API_BASE ?? 'http://localhost:8001/v1'

// ── Response helpers ─────────────────────────────────────────────

interface ApiResponse<T> {
  code: number
  message: string
  data: T
  trace_id: string
}

async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BUSINESS_BASE}${path}`, {
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) return null
    const json: ApiResponse<T> = await res.json()
    return json.code === 0 ? json.data : null
  } catch {
    return null
  }
}

async function apiPost<T>(path: string, body?: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${BUSINESS_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return null
    const json: ApiResponse<T> = await res.json()
    return json.code === 0 ? json.data : null
  } catch {
    return null
  }
}

// ── Types ────────────────────────────────────────────────────────

export interface SpotItem {
  id: string
  name: string
  nameEn?: string
  tags: string[]
  location: string
  summary: string
  intro: string
  highlights: string[]
  source: string
  freshnessLevel?: string
  scenicId?: string
}

export interface SpotGuideItem {
  spotId: string
  shortText: string
  briefText: string
  longText: string
  fallbackText: string
  source: string
}

export interface RouteItem {
  id: string
  name: string
  type: string
  duration: string
  persona: string
  tips: string
  source: string
  stops: RouteStopItem[]
}

export interface RouteStopItem {
  order: number
  spotId: string
  spotName: string
  stayDuration: string
  description: string
}

export interface RagQueryResult {
  answerable: boolean
  answer: string
  contexts: Array<{ text: string; score: number; source: string; domain: string }>
  citations: string[]
  fallback: { reason: string; message: string } | null
  latencyMs: number
}

// ── API functions ────────────────────────────────────────────────

export async function fetchSpots(): Promise<SpotItem[] | null> {
  const data = await apiGet<SpotItem[]>('/spots')
  return data
}

export async function fetchSpot(id: string): Promise<SpotItem | null> {
  return apiGet<SpotItem>(`/spots/${id}`)
}

export async function fetchSpotGuide(spotId: string): Promise<SpotGuideItem | null> {
  return apiGet<SpotGuideItem>(`/spots/${spotId}/guide`)
}

export async function fetchRoutes(): Promise<RouteItem[] | null> {
  const data = await apiGet<PaginatedData<RouteItem>>('/routes')
  return data?.items ?? null
}

export async function fetchRoute(id: string): Promise<RouteItem | null> {
  return apiGet<RouteItem>(`/routes/${id}`)
}

export async function fetchChatAnswer(question: string): Promise<{ answer: string; source: string; confidence: 'high' | 'medium' | 'low' } | null> {
  const result = await apiPost<RagQueryResult>('/rag/query', {
    query: question,
    top_k: 5,
  })
  if (!result) return null
  // 将 RAG 查询结果映射到聊天面板需要的格式
  const source = result.contexts?.[0]?.source ?? '知识库'
  let confidence: 'high' | 'medium' | 'low' = 'low'
  if (result.answerable && result.contexts?.length) {
    const topScore = result.contexts[0].score
    confidence = topScore >= 0.65 ? 'high' : topScore >= 0.45 ? 'medium' : 'low'
  }
  return {
    answer: result.answer || '抱歉，没有找到相关答案。',
    source,
    confidence,
  }
}

export async function fetchAnalytics(): Promise<Record<string, unknown> | null> {
  return apiGet<Record<string, unknown>>('/analytics')
}
