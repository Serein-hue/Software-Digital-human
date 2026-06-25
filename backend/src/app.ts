import express from 'express'
import cors from 'cors'
import { buildCorsOptions } from './config/cors.js'
import { errorHandler, notFound } from './http/errors.js'
import { analyticsRouter } from './routes/analytics.js'
import { chatRouter } from './routes/chat.js'
import { healthRouter } from './routes/health.js'
import { routesRouter } from './routes/routes.js'
import { spotsRouter } from './routes/spots.js'

export function createApp() {
  const app = express()

  app.use(cors(buildCorsOptions()))
  app.use(express.json({ limit: '64kb' }))

  app.use('/api/health', healthRouter())
  app.use('/api/spots', spotsRouter())
  app.use('/api/routes', routesRouter())
  app.use('/api/chat', chatRouter())
  app.use('/api/analytics', analyticsRouter())

  app.use((_req, _res, next) => {
    next(notFound('Not found'))
  })
  app.use(errorHandler)

  return app
}

export default createApp
