import type { Response } from 'express'

export type Pagination = {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export type ApiSuccess<T> = {
  code: 0
  message: 'success'
  data: T
  trace_id: string
}

export type ApiError = {
  code: number
  message: string
  data: null
  trace_id: string
}

export function traceId(existing?: string | string[]) {
  if (typeof existing === 'string' && existing.trim()) return existing
  return `trace_${crypto.randomUUID().replaceAll('-', '')}`
}

export function ok<T>(res: Response, data: T, trace_id: string) {
  return res.json({
    code: 0,
    message: 'success',
    data,
    trace_id,
  } satisfies ApiSuccess<T>)
}

export function page<T>(res: Response, items: T[], pagination: Pagination, trace_id: string) {
  return ok(res, { items, pagination }, trace_id)
}

export function fail(res: Response, status: number, code: number, message: string, trace_id: string) {
  return res.status(status).json({
    code,
    message,
    data: null,
    trace_id,
  } satisfies ApiError)
}
