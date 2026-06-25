import type { ErrorRequestHandler, Request } from 'express'
import { fail, traceId } from './response.js'

export const ERROR_CODES = {
  badRequest: 10001,
  notFound: 10002,
  internal: 50001,
} as const

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: number,
    message: string,
  ) {
    super(message)
  }
}

export function badRequest(message: string) {
  return new HttpError(400, ERROR_CODES.badRequest, message)
}

export function notFound(message: string) {
  return new HttpError(404, ERROR_CODES.notFound, message)
}

export function getTraceId(req: Request) {
  return traceId(req.headers['x-trace-id'])
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const requestTraceId = getTraceId(req)

  if (error instanceof SyntaxError && 'body' in error) {
    return fail(res, 400, ERROR_CODES.badRequest, 'Invalid JSON body', requestTraceId)
  }

  if (error instanceof HttpError) {
    return fail(res, error.status, error.code, error.message, requestTraceId)
  }

  return fail(res, 500, ERROR_CODES.internal, 'Internal server error', requestTraceId)
}
