import type { Request } from 'express'
import { badRequest } from './errors.js'
import type { Pagination } from './response.js'

const MAX_PAGE_SIZE = 50
const DEFAULT_PAGE_SIZE = 20

export type ListQuery = {
  page: number
  pageSize: number
  search?: string
  category?: string
}

function firstQueryValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value
}

function parsePositiveInt(value: unknown, fallback: number) {
  if (value === undefined) return fallback
  const raw = firstQueryValue(value)
  if (typeof raw !== 'string' && typeof raw !== 'number') return Number.NaN
  const parsed = Number(raw)
  return Number.isInteger(parsed) ? parsed : Number.NaN
}

function parseString(value: unknown) {
  const raw = firstQueryValue(value)
  return typeof raw === 'string' ? raw.trim() : undefined
}

export function parseListQuery(req: Request): ListQuery {
  const limit = parsePositiveInt(req.query.limit, Number.NaN)
  const pageSize = Number.isNaN(limit)
    ? parsePositiveInt(req.query.page_size, DEFAULT_PAGE_SIZE)
    : limit
  const page = parsePositiveInt(req.query.page, 1)

  if (page < 1 || pageSize < 1 || pageSize > MAX_PAGE_SIZE || Number.isNaN(page) || Number.isNaN(pageSize)) {
    throw badRequest('page must be >= 1 and page_size must be between 1 and 50')
  }

  const search = parseString(req.query.search)
  const category = parseString(req.query.category)

  return {
    page,
    pageSize,
    search: search || undefined,
    category: category || undefined,
  }
}

export function paginate<T>(items: T[], query: ListQuery): { items: T[]; pagination: Pagination } {
  const start = (query.page - 1) * query.pageSize
  const totalPages = Math.ceil(items.length / query.pageSize)

  return {
    items: items.slice(start, start + query.pageSize),
    pagination: {
      page: query.page,
      page_size: query.pageSize,
      total: items.length,
      total_pages: totalPages,
    },
  }
}
