import { Router } from 'express'
import { getTraceId, notFound } from '../http/errors.js'
import { paginate, parseListQuery } from '../http/query.js'
import { ok, page } from '../http/response.js'
import { getRoute, listRoutes } from '../services/routes.js'

export function routesRouter() {
  const router = Router()

  router.get('/', (req, res, next) => {
    try {
      const query = parseListQuery(req)
      const result = paginate(listRoutes(query), query)
      return page(res, result.items, result.pagination, getTraceId(req))
    } catch (error) {
      return next(error)
    }
  })

  router.get('/:id', (req, res, next) => {
    const route = getRoute(req.params.id)
    if (!route) return next(notFound('Route not found'))
    return ok(res, route, getTraceId(req))
  })

  return router
}
