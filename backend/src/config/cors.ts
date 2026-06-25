import type { CorsOptions } from 'cors'

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]

export function buildCorsOptions(): CorsOptions {
  const allowedOrigins = (process.env.CORS_ORIGINS ?? DEFAULT_DEV_ORIGINS.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(null, false)
    },
  }
}
