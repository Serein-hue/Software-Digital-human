/** API client for scenic-dh-business-api (:8001/v1) */

import * as mock from './mock-data'

const BUSINESS_BASE = import.meta.env.VITE_BUSINESS_API_BASE ?? (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '/v1'
    : 'http://localhost:8001/v1'
)
const IS_DEMO = typeof window !== 'undefined' && (
  window.location.hostname.includes('github.io') ||
  window.location.protocol === 'file:'
)

// ── Mock 数据路由 ──────────────────────────────────────────────────

function mockGetVisitor<T>(path: string): T | null {
  const p = path.split('?')[0]
  if (p === '/spots') return mock.MOCK_SPOTS as T
  if (p.startsWith('/spots/') && p.endsWith('/guide')) {
    const spotId = p.split('/')[2]
    const guides: Record<string, any> = {
      'LS-011': { spotId: 'LS-011', shortText: '灵山大佛是世界最高的露天青铜释迦牟尼立像，通高88米。', briefText: '灵山大佛通高88米，用铜725吨，右手施无畏印，左手施与愿印。登216级登云道可抱佛脚祈福，俯瞰太湖全景。', longText: '灵山大佛位于无锡灵山胜境秦履峰南侧，是世界上最高的露天青铜释迦牟尼立像。佛像通高88米（佛体79米+莲花瓣9米），含台基总高101.5米，总用铜量725吨，由2000块6-8毫米厚的铜壁板构成，焊缝总长度逾35公里。右手施无畏印除却众生痛苦，左手施与愿印赐予众生欢乐。登216级登云道（暗合108烦恼+108愿望）可亲手抱佛脚祈福。开放时间8:00-17:00。', fallbackText: '灵山大佛是灵山胜境核心景点，世界最高青铜立像。', source: '景点结构化数据集' },
      'LS-012': { spotId: 'LS-012', shortText: '灵山梵宫被誉为东方卢浮宫，建筑面积7.2万㎡。', briefText: '梵宫汇集东阳木雕、琉璃、油画等传统工艺，28米高星空穹顶用100公斤纯金绘制。每日上演《灵山吉祥颂》。', longText: '灵山梵宫建筑面积7.2万平方米，最高处66.5米，被誉为东方卢浮宫。内部汇集东阳木雕、琉璃、油画、景泰蓝等传统工艺，28米高星空穹顶用100公斤纯金绘制。核心琉璃巨制《华藏世界》由160块彩色琉璃拼接而成。每日上演《灵山吉祥颂》大型演出，时间：10:35、11:30、14:00、16:00。', fallbackText: '灵山梵宫是景区的文化瑰宝，必游景点。', source: '景点结构化数据集' },
      'LS-013': { spotId: 'LS-013', shortText: '九龙灌浴是动态音乐群雕表演，每日4-5场。', briefText: '总高27.2米，青铜重量260吨。莲花瓣开启，太子佛旋转升起，每场约15分钟。', longText: '九龙灌浴位于景区中轴线核心，总高27.2米，青铜重量260吨。每日4-5场表演（10:00、11:30、13:30、15:00），莲花瓣缓缓开启，太子佛在九龙喷泉与《佛之诞》音乐中旋转升起。每场约15分钟，建议提前10分钟到场。', fallbackText: '九龙灌浴是深受游客欢迎的动态表演。', source: '景点结构化数据集' },
      'LS-014': { spotId: 'LS-014', shortText: '五印坛城是藏式风格建筑，108个转经筒。', briefText: '五层重檐楼宇，总高约30米。转经筒长廊环绕主殿，登顶可俯瞰全景。', longText: '五印坛城位于香水海中央独立圆岛上，五层重檐楼宇，总高约30米，占地5000平方米。藏式碉楼风格，白墙红边金顶。转经筒长廊摆放108个纯铜转经筒，游客可顺时针转动祈福。登顶层观景台可俯瞰全景。', fallbackText: '五印坛城是体验藏式佛教文化的好去处。', source: '景点结构化数据集' },
    }
    return (guides[spotId] || null) as T
  }
  if (p.startsWith('/spots/')) {
    const id = p.split('/')[2]
    const spot = mock.MOCK_SPOTS.find(s => s.id === id)
    return (spot || null) as T
  }
  if (p === '/routes') return { items: mock.MOCK_ROUTES, pagination: { page: 1, pageSize: 20, total: mock.MOCK_ROUTES.length } } as T
  if (p.startsWith('/routes/')) {
    const id = p.split('/')[2]
    const route = mock.MOCK_ROUTES.find(r => r.id === id)
    return (route || null) as T
  }
  return null
}

function mockPostVisitor<T>(path: string, body: unknown): T | null {
  if (path === '/rag/query') {
    const query = (body as any)?.query || ''
    const result = mock.getMockRagResult(query)
    return result as T
  }
  return null
}

// ── Response helpers ─────────────────────────────────────────────

interface ApiResponse<T> {
  code: number
  message: string
  data: T
  trace_id: string
}

async function apiGet<T>(path: string): Promise<T | null> {
  if (IS_DEMO) return mockGetVisitor<T>(path)
  try {
    const res = await fetch(`${BUSINESS_BASE}${path}`, {
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) return mockGetVisitor<T>(path)
    const json: ApiResponse<T> = await res.json()
    return json.code === 0 ? json.data : mockGetVisitor<T>(path)
  } catch {
    return mockGetVisitor<T>(path)
  }
}

async function apiPost<T>(path: string, body?: unknown): Promise<T | null> {
  if (IS_DEMO) return mockPostVisitor<T>(path, body)
  try {
    const res = await fetch(`${BUSINESS_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return mockPostVisitor<T>(path, body)
    const json: ApiResponse<T> = await res.json()
    return json.code === 0 ? json.data : mockPostVisitor<T>(path, body)
  } catch {
    return mockPostVisitor<T>(path, body)
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
  const data = await apiGet<SpotItem[] | PaginatedData<SpotItem>>('/spots')
  if (Array.isArray(data)) return data  // mock 数据直接返回数组
  if (data?.items && data.items.length > 0) return data.items  // API 返回分页数据
  // API 返回空数据时降级到 Mock
  const mockData = mockGetVisitor<SpotItem[]>('/spots')
  return Array.isArray(mockData) ? mockData : null
}

export async function fetchSpot(id: string): Promise<SpotItem | null> {
  return apiGet<SpotItem>(`/spots/${id}`)
}

export async function fetchSpotGuide(spotId: string): Promise<SpotGuideItem | null> {
  return apiGet<SpotGuideItem>(`/spots/${spotId}/guide`)
}

interface PaginatedData<T> {
  items: T[]
  pagination: { page: number; pageSize: number; total: number }
}

export async function fetchRoutes(): Promise<RouteItem[] | null> {
  const data = await apiGet<PaginatedData<RouteItem>>('/routes')
  if (data?.items && data.items.length > 0) {
    return data.items
  }
  // API 返回空数据时降级到 Mock
  const mockData = mockGetVisitor<PaginatedData<RouteItem>>('/routes')
  return mockData?.items ?? null
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
