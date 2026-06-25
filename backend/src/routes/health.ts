import { Router } from 'express'
import { getTraceId } from '../http/errors.js'
import { ok } from '../http/response.js'

export function healthRouter() {
  const router = Router()

  router.get('/', (req, res) => ok(res, { status: 'ok', uptime: process.uptime() }, getTraceId(req)))

  return router
}
