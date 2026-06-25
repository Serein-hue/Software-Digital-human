import { ROUTES } from '../data.js'
import type { ListQuery } from '../http/query.js'

export function listRoutes(query: ListQuery) {
  return ROUTES.filter((route) => {
    if (!query.search) return true
    return `${route.title} ${route.description} ${route.tags.join(' ')}`.includes(query.search)
  })
}

export function getRoute(id: string) {
  return ROUTES.find((route) => route.id === id) ?? null
}
