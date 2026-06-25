import { Router } from 'express'
import { getTraceId, notFound } from '../http/errors.js'
import { paginate, parseListQuery } from '../http/query.js'
import { ok, page } from '../http/response.js'
import { getRelatedSpots, getSpot, listSpots } from '../services/spots.js'

export function spotsRouter() {
  const router = Router()

  router.get('/', (req, res, next) => {
    try {
      const query = parseListQuery(req)
      const result = paginate(listSpots(query), query)
      return page(res, result.items, result.pagination, getTraceId(req))
    } catch (error) {
      return next(error)
    }
  })

  router.get('/:id', (req, res, next) => {
    const spot = getSpot(req.params.id)
    if (!spot) return next(notFound('Spot not found'))
    return ok(res, spot, getTraceId(req))
  })

  router.get('/:id/related', (req, res, next) => {
    const related = getRelatedSpots(req.params.id)
    if (!related) return next(notFound('Spot not found'))
    return ok(res, related, getTraceId(req))
  })

  return router
}
