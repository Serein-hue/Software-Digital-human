import { Router } from 'express'
import { getTraceId } from '../http/errors.js'
import { ok } from '../http/response.js'
import { getAnalytics, getRealtimeAnalytics } from '../services/analytics.js'

export function analyticsRouter() {
  const router = Router()

  router.get('/', (req, res) => ok(res, getAnalytics(), getTraceId(req)))
  router.get('/realtime', (req, res) => ok(res, getRealtimeAnalytics(), getTraceId(req)))

  return router
}
