/**
 * 员工工作台 API — 对接 business-api (:8001/v1)
 *
 * 所有接口需要 staff 角色的 Bearer token，http 拦截器自动带 token。
 */

import { httpGet, httpPost } from '@/http/http'

// ── 类型定义 ────────────────────────────────────────────────────────

export interface StaffOverview {
  pendingWorkOrders: number
  pendingEmergencies: number
  recentFeedbacks24h: number
  activeVisitors5min: number
  staffName: string
  staffTitle: string
}

export interface WorkOrderItem {
  id: string
  sessionId: string
  category: string
  description: string
  location: string
  contact: string
  status: string       // pending / processing / resolved / closed
  handler: string | null
  resolution: string | null
  createdAt: string
  updatedAt: string
}

export interface EmergencyItem {
  id: string
  sessionId: string
  emergencyType: string
  description: string
  location: string
  contact: string
  status: string       // pending / dispatching / arrived / resolved
  dispatcher: string | null
  createdAt: string
  updatedAt: string
}

export interface FeedbackItem {
  id: string
  sessionId: string
  rating: number
  resolved: boolean
  comment: string
  createdAt: string
}

export interface PaginatedResult<T> {
  items: T[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

export interface StaffRealtime {
  activeVisitors: number
  pendingWorkOrders: number
  pendingEmergencies: number
  todayAvgRating: number | null
  spotDistribution: Array<{ id: string; count: number }>
  mockQueueStats: Array<{ spot: string; queueMinutes: number; crowdLevel: string }>
  updatedAt: string
}

// ── 工具 ──────────────────────────────────────────────────────────

function unwrapItems<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object' && Array.isArray(data.items)) return data.items as T[]
  return []
}

// ── 概览 ──────────────────────────────────────────────────────────

export async function getStaffOverview(): Promise<StaffOverview | null> {
  try {
    return await httpGet<StaffOverview>('/staff/overview')
  } catch {
    return null
  }
}

// ── 实时看板 ─────────────────────────────────────────────────────

export async function getStaffRealtime(): Promise<StaffRealtime | null> {
  try {
    return await httpGet<StaffRealtime>('/staff/realtime')
  } catch {
    return null
  }
}

// ── 工单 ─────────────────────────────────────────────────────────

export async function getWorkOrders(
  page = 1,
  pageSize = 20,
  status?: string,
): Promise<PaginatedResult<WorkOrderItem> | null> {
  try {
    const params: Record<string, any> = { page, page_size: pageSize }
    if (status) params.status = status
    return await httpGet<PaginatedResult<WorkOrderItem>>('/staff/work-orders', params)
  } catch {
    return null
  }
}

export async function handleWorkOrder(orderId: string): Promise<boolean> {
  try {
    await httpPost(`/staff/work-orders/${orderId}/handle`, {})
    return true
  } catch {
    return false
  }
}

export async function resolveWorkOrder(orderId: string, resolution = '已处理'): Promise<boolean> {
  try {
    await httpPost(`/staff/work-orders/${orderId}/resolve`, { resolution })
    return true
  } catch {
    return false
  }
}

export async function closeWorkOrder(orderId: string): Promise<boolean> {
  try {
    await httpPost(`/staff/work-orders/${orderId}/close`, {})
    return true
  } catch {
    return false
  }
}

// ── 应急求助 ─────────────────────────────────────────────────────

export async function getEmergencies(
  page = 1,
  pageSize = 20,
  status?: string,
): Promise<PaginatedResult<EmergencyItem> | null> {
  try {
    const params: Record<string, any> = { page, page_size: pageSize }
    if (status) params.status = status
    return await httpGet<PaginatedResult<EmergencyItem>>('/staff/emergencies', params)
  } catch {
    return null
  }
}

export async function dispatchEmergency(emergencyId: string): Promise<boolean> {
  try {
    await httpPost(`/staff/emergencies/${emergencyId}/dispatch`, {})
    return true
  } catch {
    return false
  }
}

export async function resolveEmergency(emergencyId: string): Promise<boolean> {
  try {
    await httpPost(`/staff/emergencies/${emergencyId}/resolve`, {})
    return true
  } catch {
    return false
  }
}

// ── 反馈 ─────────────────────────────────────────────────────────

export async function getFeedbacks(
  page = 1,
  pageSize = 20,
  minRating?: number,
): Promise<PaginatedResult<FeedbackItem> | null> {
  try {
    const params: Record<string, any> = { page, page_size: pageSize }
    if (minRating !== undefined) params.min_rating = minRating
    return await httpGet<PaginatedResult<FeedbackItem>>('/staff/feedbacks', params)
  } catch {
    return null
  }
}
