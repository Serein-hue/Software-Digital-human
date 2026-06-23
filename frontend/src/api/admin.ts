/** Admin API — 对接 scenic-dh-admin-api (http://localhost:8002/v1/admin) */

const ADMIN_BASE = import.meta.env.VITE_ADMIN_API_BASE ?? 'http://localhost:8002/v1/admin'

interface ApiResponse<T> {
  code: number
  message: string
  data: T
  trace_id: string
}

interface Pagination {
  page: number
  page_size: number
  total: number
  total_pages: number
}

interface PaginatedData<T> {
  items: T[]
  pagination: Pagination
}

// ── 类型定义 ──────────────────────────────────────────────────────────

export interface KbStatus {
  status: string
  vectors: number
  provider: string
  embeddingModel: string
  scoreThreshold: number
  chunkSize: number
  sourcesCount: number
  qaCount: number
  error?: string
}

export interface SourceItem {
  name: string
  filepath: string
  domain: string
  description: string
  tags: string[]
  createdAt: string
}

export interface QAItem {
  question: string
  answer: string
  source: string
  domain: string
  createdAt: string
}

export interface IngestResult {
  jobId: string
  chunks: number
  success: boolean
  message: string
}

export interface ReindexResult {
  jobId: string
  status: string
  message: string
}

export interface TestQueryResult {
  answerable: boolean
  score: number
  contexts: Array<{
    text: string
    score: number
    source: string
    domain: string
  }>
  citations: string[]
  fallback: { reason: string; message: string } | null
  latencyMs: number
}

export interface LowConfidenceItem {
  id: string | number
  userQuestion: string
  assistantReply: string
  confidence: number
  fallbackReason: string | null
  createdAt: string
}

// ── 请求工具 ──────────────────────────────────────────────────────────

async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${ADMIN_BASE}${path}`, {
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
    const res = await fetch(`${ADMIN_BASE}${path}`, {
      method: 'POST',
      headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(body instanceof FormData ? 120_000 : 10_000),
    })
    if (!res.ok) return null
    const json: ApiResponse<T> = await res.json()
    return json.code === 0 ? json.data : null
  } catch {
    return null
  }
}

// ── API 函数 ──────────────────────────────────────────────────────────

export async function fetchKbStatus(): Promise<KbStatus | null> {
  return apiGet<KbStatus>('/knowledge/status')
}

export async function fetchSources(page = 1, pageSize = 20): Promise<PaginatedData<SourceItem> | null> {
  return apiGet<PaginatedData<SourceItem>>(`/knowledge/sources?page=${page}&page_size=${pageSize}`)
}

export async function uploadDocument(
  file: File,
  sourceName?: string,
  domain?: string,
): Promise<IngestResult | null> {
  const form = new FormData()
  form.append('file', file)
  if (sourceName) form.append('source_name', sourceName)
  if (domain) form.append('domain', domain)
  return apiPost<IngestResult>('/knowledge/ingest', form)
}

export async function triggerReindex(scenicId = 'SA-001', reason = 'manual'): Promise<ReindexResult | null> {
  return apiPost<ReindexResult>('/knowledge/reindex', { scenicId, reason })
}

export async function fetchQAList(page = 1, pageSize = 20): Promise<PaginatedData<QAItem> | null> {
  return apiGet<PaginatedData<QAItem>>(`/knowledge/qa?page=${page}&page_size=${pageSize}`)
}

export async function registerQA(
  question: string,
  answer: string,
  source?: string,
  domain?: string,
): Promise<{ question: string; answer: string } | null> {
  return apiPost('/knowledge/qa', { question, answer, source: source || 'admin_manual', domain: domain || 'general' })
}

export async function testQuery(query: string, topK = 5): Promise<TestQueryResult | null> {
  return apiPost<TestQueryResult>('/knowledge/test-query', { query, top_k: topK })
}

export async function fetchLowConfidenceQueries(
  page = 1,
  pageSize = 20,
): Promise<PaginatedData<LowConfidenceItem> | null> {
  return apiGet<PaginatedData<LowConfidenceItem>>(`/knowledge/low-confidence-queries?page=${page}&page_size=${pageSize}`)
}
