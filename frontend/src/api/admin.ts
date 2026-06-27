/** Admin API client for scenic-dh-admin-api. */

const ADMIN_BASE = import.meta.env.VITE_ADMIN_API_BASE ?? 'http://localhost:8002/v1'
const ADMIN_TOKEN_STORAGE_KEY = 'scenic_admin_token'

function getAdminToken(): string | null {
  return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getAdminToken()
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra }
}

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
      headers: authHeaders(),
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
  const isFormData = body instanceof FormData
  try {
    const res = await fetch(`${ADMIN_BASE}${path}`, {
      method: 'POST',
      headers: isFormData ? authHeaders() : authHeaders({ 'Content-Type': 'application/json' }),
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(body instanceof FormData ? 120_000 : 10_000),
    })
    if (!res.ok) return null
    const json: ApiResponse<T> = await res.json()
    return json.code === 0 ? json.data : null
  } catch {
    return null
  }
}

// ── Auth API ─────────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  username: string
  displayName: string
  roleId?: string
}

export async function loginAdmin(username: string, password: string): Promise<AdminUser | null> {
  const result = await apiPost<{ token: string; user: AdminUser }>('/auth/login', { username, password })
  if (!result?.token) return null
  window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, result.token)
  return result.user
}

export async function logoutAdmin(): Promise<void> {
  await apiPost('/auth/logout')
  window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
}

export async function fetchCurrentAdmin(): Promise<AdminUser | null> {
  return apiGet<AdminUser>('/auth/me')
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

export interface AnswerResult extends TestQueryResult {
  answer: string
  tokens: number
  llmError: string | null
}

export async function answerQuery(query: string, topK = 5): Promise<AnswerResult | null> {
  return apiPost<AnswerResult>('/knowledge/answer', { query, top_k: topK })
}

export interface AnswerAndBroadcastResult {
  answer: string
  answerable: boolean
  tokens: number
  llmError: string | null
  broadcastStatus: 'sent' | 'fay_offline' | 'error' | 'skipped' | 'unknown'
  broadcastMessage: string
}

export async function answerAndBroadcast(query: string, topK = 5): Promise<AnswerAndBroadcastResult | null> {
  return apiPost<AnswerAndBroadcastResult>('/knowledge/answer-and-broadcast', { query, top_k: topK })
}

export async function fetchLowConfidenceQueries(
  page = 1,
  pageSize = 20,
): Promise<PaginatedData<LowConfidenceItem> | null> {
  return apiGet<PaginatedData<LowConfidenceItem>>(`/knowledge/low-confidence-queries?page=${page}&page_size=${pageSize}`)
}

// ── Runtime / Fay 数字人监控 ─────────────────────────────────────────

export interface RuntimeStatus {
  fayOnline: boolean
  digitalHumanConnected: boolean
  mcpOnline: boolean
  ttsOnline: boolean
  speaking: boolean
  queueLength: number
  lastError: string | null
}

export interface QueueStatus {
  queueLength: number
  fayOnline: boolean
  speaking: boolean
}

export interface BroadcastResult {
  text: string
  queued: boolean
  result: unknown
}

export interface MicToggleResult {
  microphone: string
  status: string
}

export interface QueueClearResult {
  queue: string
  queueLength: number
}

export async function fetchRuntimeStatus(): Promise<RuntimeStatus | null> {
  return apiGet<RuntimeStatus>('/runtime/status')
}

export async function fetchQueueStatus(): Promise<QueueStatus | null> {
  return apiGet<QueueStatus>('/runtime/queue')
}

export async function sendBroadcast(text: string, speaker = '广播消息'): Promise<BroadcastResult | null> {
  return apiPost<BroadcastResult>('/runtime/broadcast', { text, speaker })
}

export async function toggleMicrophone(): Promise<MicToggleResult | null> {
  return apiPost<MicToggleResult>('/runtime/microphone/toggle')
}

export async function clearQueue(): Promise<QueueClearResult | null> {
  return apiPost<QueueClearResult>('/runtime/clear-queue')
}

// ── 工单中心 ─────────────────────────────────────────────────────────

export interface WorkOrder {
  id: string
  sessionId: string
  category: 'complaint' | 'suggestion' | 'repair' | 'other'
  description: string
  location: string
  contact: string
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  handler: string | null
  resolution: string | null
  createdAt: string
  updatedAt: string
}

export interface Emergency {
  id: string
  sessionId: string
  emergencyType: 'medical' | 'lost' | 'security' | 'fire' | 'other'
  location: string
  contact: string
  description: string
  status: 'pending' | 'dispatching' | 'arrived' | 'resolved'
  dispatcher: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Feedback {
  id: string
  sessionId: string
  messageId: string | null
  rating: number
  resolved: boolean
  comment: string
  createdAt: string
}

// ── 工单 API ─────────────────────────────────────────────────────────

export async function fetchWorkOrders(
  page = 1,
  pageSize = 20,
  status?: string,
  category?: string,
): Promise<PaginatedData<WorkOrder> | null> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  if (status) params.set('status', status)
  if (category) params.set('category', category)
  return apiGet<PaginatedData<WorkOrder>>(`/work-orders?${params}`)
}

export async function handleWorkOrder(orderId: string): Promise<{ workOrderId: string; status: string } | null> {
  return apiPost(`/work-orders/${orderId}/handle`)
}

export async function resolveWorkOrder(orderId: string, resolution = '已处理'): Promise<{ workOrderId: string; status: string } | null> {
  return apiPost(`/work-orders/${orderId}/resolve`, { resolution })
}

export async function closeWorkOrder(orderId: string): Promise<{ workOrderId: string; status: string } | null> {
  return apiPost(`/work-orders/${orderId}/close`)
}

// ── 应急 API ─────────────────────────────────────────────────────────

export async function fetchEmergencies(
  page = 1,
  pageSize = 20,
  status?: string,
): Promise<PaginatedData<Emergency> | null> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  if (status) params.set('status', status)
  return apiGet<PaginatedData<Emergency>>(`/emergencies?${params}`)
}

export async function dispatchEmergency(emergencyId: string): Promise<{ emergencyId: string; status: string } | null> {
  return apiPost(`/emergencies/${emergencyId}/dispatch`)
}

export async function resolveEmergency(emergencyId: string): Promise<{ emergencyId: string; status: string } | null> {
  return apiPost(`/emergencies/${emergencyId}/resolve`)
}

// ── 反馈 API ─────────────────────────────────────────────────────────

export async function fetchFeedbacks(
  page = 1,
  pageSize = 20,
  minRating?: number,
): Promise<PaginatedData<Feedback> | null> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  if (minRating !== undefined) params.set('min_rating', String(minRating))
  return apiGet<PaginatedData<Feedback>>(`/feedbacks?${params}`)
}

// ═══════════════════════════════════════════════════════════════════════
// 运营分析（大屏数据）
// ═══════════════════════════════════════════════════════════════════════

export interface OverviewData {
  activeVisitors: number
  totalSpots: number
  pendingWorkOrders: number
  pendingEmergencies: number
  avgRating: number
}

export interface SpotHeatItem {
  id: string
  name: string
  activeVisitors: number
}

export interface SpotHeatData {
  items: SpotHeatItem[]
  totalActive: number
}

export interface CrowdFlowItem {
  hour: string
  count: number
}

export interface CrowdFlowData {
  items: CrowdFlowItem[]
}

export interface QueueStatItem {
  spot: string
  queueMinutes: number
  crowdLevel: string
  activeTickets: number
}

export interface QueueStatsData {
  items: QueueStatItem[]
}

export async function fetchOverview(): Promise<OverviewData | null> {
  return apiGet<OverviewData>('/admin/analytics/overview')
}

export async function fetchSpotHeat(minutes = 5): Promise<SpotHeatData | null> {
  return apiGet<SpotHeatData>(`/admin/analytics/spot-heat?minutes=${minutes}`)
}

export async function fetchCrowdFlow(): Promise<CrowdFlowData | null> {
  return apiGet<CrowdFlowData>('/admin/analytics/crowd-flow')
}

export async function fetchQueueStats(): Promise<QueueStatsData | null> {
  return apiGet<QueueStatsData>('/admin/analytics/queue')
}
