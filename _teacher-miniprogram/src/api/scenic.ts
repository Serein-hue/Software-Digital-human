/**
 * 景区业务 API — 对接 business-api (:8001/v1)
 *
 * 所有接口返回 { code: 0, message: 'success', data: ..., trace_id: '...' }
 * http 模块自动解包 data，所以这里拿到的已经是 data 的内容。
 *
 * 分页列表: data = { items: [...], pagination: {...} }
 * → 用 unwrapItems() 提取数组
 */

import { httpGet, httpPost, httpPut } from '@/http/http'

// ── 工具 ──────────────────────────────────────────────────────────

function unwrapItems<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object' && Array.isArray(data.items)) return data.items as T[]
  return []
}

// ── 类型定义 ───────────────────────────────────────────────────────

export interface SpotItem {
  id: string
  name: string
  summary?: string
  category?: string
  tags?: string[]
  location?: string
  shortIntro?: string
  heroGradient?: string
  source?: string
}

export interface RouteItem {
  id: string
  name: string
  description?: string
  duration?: string
  difficulty?: string
  stops?: RouteStop[]
}

export interface RouteStop {
  spotName: string
  stayDuration?: string
  description?: string
}

export interface NoticeItem {
  id: string
  type: string // info | warning | emergency
  title: string
  content: string
  active: boolean
}

export interface EventItem {
  id: string
  name: string
  spotId?: string
  time?: string
  description?: string
  status?: string
}

export interface ServiceItem {
  id: string
  name: string
  type: string
  location?: string
  distance?: string
  description?: string
}

export interface TicketProduct {
  id: string
  name: string
  price: number
  originalPrice?: number
  description?: string
  validPeriod?: string
}

export interface TicketOrder {
  id: string
  orderNo: string
  status: string
  productName: string
  quantity: number
  visitDate: string
}

export interface QueueResource {
  id: string
  name: string
  currentNumber: number
  waitTime: number
  status: string
}

export interface QueueTicket {
  id: string
  queueId: string
  number: number
  status: string
  waitCount: number
}

// ── Session / 会话 ────────────────────────────────────────────────

let _sessionId: string | null = null

/** 创建匿名会话，返回 sessionId */
export async function createSession(): Promise<string> {
  const data = await httpPost<any>('/sessions', { scenicId: 'SA-001' })
  const id = data?.id || data?.sessionId || ''
  if (id) _sessionId = id
  return id
}

/** 获取当前 session ID */
export function getSessionId(): string | null {
  return _sessionId
}

/** 设置 session ID（外部恢复用） */
export function setSessionId(id: string) {
  _sessionId = id
}

// ── 景点 ──────────────────────────────────────────────────────────

export async function getSpots(params?: { limit?: number }): Promise<SpotItem[]> {
  const data = await httpGet<any>('/spots', params)
  return unwrapItems<SpotItem>(data)
}

export async function getSpotDetail(spotId: string): Promise<SpotItem | null> {
  try {
    const data = await httpGet<any>(`/spots/${spotId}`)
    return data || null
  } catch {
    return null
  }
}

// ── 路线 ──────────────────────────────────────────────────────────

export async function getRoutes(): Promise<RouteItem[]> {
  const data = await httpGet<any>('/routes')
  return unwrapItems<RouteItem>(data)
}

// ── 公告 ──────────────────────────────────────────────────────────

export async function getNotices(): Promise<NoticeItem[]> {
  const data = await httpGet<any>('/notices')
  return unwrapItems<NoticeItem>(data)
}

// ── 活动/演出 ──────────────────────────────────────────────────────

export async function getEvents(): Promise<EventItem[]> {
  const data = await httpGet<any>('/events')
  return unwrapItems<EventItem>(data)
}

// ── 服务设施 ──────────────────────────────────────────────────────

export async function getServices(): Promise<ServiceItem[]> {
  const data = await httpGet<any>('/services')
  return unwrapItems<ServiceItem>(data)
}

// ── 天气 ──────────────────────────────────────────────────────────

export interface WeatherInfo {
  temperature?: string
  weather?: string
  humidity?: string
  tips?: string
}

export async function getWeather(): Promise<WeatherInfo | null> {
  try {
    return await httpGet<WeatherInfo>('/weather') || null
  } catch {
    return null
  }
}

// ── 排队 ──────────────────────────────────────────────────────────

export async function getQueues(): Promise<QueueResource[]> {
  const data = await httpGet<any>('/queues')
  return data && Array.isArray(data) ? data : (data?.items || [])
}

export async function takeQueueTicket(queueId: string): Promise<QueueTicket | null> {
  try {
    const data = await httpPost<any>('/queue/tickets', { queueId })
    return data || null
  } catch {
    return null
  }
}

export async function getQueueTicket(ticketId: string): Promise<QueueTicket | null> {
  try {
    const data = await httpGet<any>(`/queue/tickets/${ticketId}`)
    return data || null
  } catch {
    return null
  }
}

export async function cancelQueueTicket(ticketId: string): Promise<boolean> {
  try {
    await httpPost<any>(`/queue/tickets/${ticketId}/cancel`, {})
    return true
  } catch {
    return false
  }
}

// ── 票务 ──────────────────────────────────────────────────────────

export async function getTicketProducts(): Promise<TicketProduct[]> {
  const data = await httpGet<any>('/tickets/products')
  return unwrapItems<TicketProduct>(data)
}

export async function getTicketOrders(): Promise<TicketOrder[]> {
  try {
    const data = await httpGet<any>('/tickets/orders')
    return unwrapItems<TicketOrder>(data)
  } catch {
    return []
  }
}

export async function verifyTicket(code: string): Promise<{ valid: boolean; message: string } | null> {
  try {
    const data = await httpPost<any>('/tickets/verify', { code })
    return data || null
  } catch {
    return null
  }
}

// ── AI 问答 ────────────────────────────────────────────────────────

export interface AiAnswer {
  content?: string
  text?: string
  answer?: string
  source?: string
  confidence?: string
  citations?: Array<{ text: string; source: string }>
}

export async function sendMessage(sessionId: string, text: string): Promise<AiAnswer | null> {
  try {
    const data = await httpPost<any>(`/sessions/${sessionId}/messages`, { role: 'user', text })
    if (!data) return null
    // 可能返回消息数组、单个消息对象、或带 answer 字段的对象
    const last = Array.isArray(data)
      ? data[data.length - 1]
      : data.items
        ? data.items[data.items.length - 1]
        : data
    return last || null
  } catch {
    return null
  }
}

// ── 地图 POI ────────────────────────────────────────────────────

export interface MapPOI {
  id: string
  name: string
  type: string       // spot | facility | entrance | exit | danger | service
  latitude: number
  longitude: number
  description?: string
  status?: string     // open | closed | busy
}

export async function getMapPOIs(): Promise<MapPOI[]> {
  const data = await httpGet<any>('/map/pois')
  return unwrapItems<MapPOI>(data)
}

export async function getMapLayers(): Promise<any[]> {
  try {
    const data = await httpGet<any>('/map/layers')
    return unwrapItems<any>(data)
  } catch {
    return []
  }
}

// ── 位置上报（客流监听）────────────────────────────────────────────

/**
 * 上报当前位置到服务端，用于后台实时客流统计
 * 小程序端建议每 30-60 秒调用一次
 */
export async function reportLocation(
  sessionId: string,
  latitude: number,
  longitude: number,
  nearSpotId?: string,
): Promise<boolean> {
  try {
    await httpPost<any>(`/sessions/${sessionId}/location`, {
      latitude,
      longitude,
      accuracy: 0,
      nearSpotId: nearSpotId || null,
    })
    return true
  } catch {
    return false
  }
}

// ── 二维码 ────────────────────────────────────────────────────────

export interface QRCodeResult {
  type: string      // spot | ticket | event | device
  targetId: string
  action: string    // guide | verify | queue
  data?: any
}

export async function resolveQRCode(code: string): Promise<QRCodeResult | null> {
  try {
    const data = await httpPost<any>('/qrcode/resolve', { code })
    return data || null
  } catch {
    return null
  }
}

// ── 反馈 ──────────────────────────────────────────────────────────

export async function submitFeedback(
  sessionId: string,
  data: { type?: string; content: string; image?: string; location?: string },
): Promise<boolean> {
  try {
    await httpPost<any>(`/sessions/${sessionId}/feedback`, data)
    return true
  } catch {
    return false
  }
}

// ── 应急 ──────────────────────────────────────────────────────────

export async function submitEmergency(
  data: { type: string; description: string; contact: string; location?: string },
): Promise<{ id?: string } | null> {
  try {
    return await httpPost<any>('/emergency/requests', data) || null
  } catch {
    return null
  }
}
