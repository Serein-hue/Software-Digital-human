const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001'

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

let backendAvailable: boolean | null = null

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  if (backendAvailable === false) return null
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    backendAvailable = true
    return res.json()
  } catch {
    backendAvailable = false
    return null
  }
}

export async function fetchSpots(): Promise<SpotSummary[] | null> {
  return apiFetch<SpotSummary[]>('/api/spots')
}

export async function fetchSpot(id: string): Promise<SpotDetail | null> {
  return apiFetch<SpotDetail>(`/api/spots/${id}`)
}

export async function fetchRelatedSpots(id: string): Promise<SpotSummary[] | null> {
  return apiFetch<SpotSummary[]>(`/api/spots/${id}/related`)
}

export async function fetchRoutes(): Promise<RouteData[] | null> {
  return apiFetch<RouteData[]>('/api/routes')
}

export async function fetchRoute(id: string): Promise<RouteData | null> {
  return apiFetch<RouteData>(`/api/routes/${id}`)
}

export async function fetchChatAnswer(question: string): Promise<ChatResponse | null> {
  return apiFetch<ChatResponse>('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
}

export async function fetchAnalytics(): Promise<AnalyticsData | null> {
  return apiFetch<AnalyticsData>('/api/analytics')
}

export function isBackendAvailable(): boolean | null {
  return backendAvailable
}
