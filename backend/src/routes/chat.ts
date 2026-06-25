import { Router } from 'express'
import { getTraceId } from '../http/errors.js'
import { ok } from '../http/response.js'
import { answerQuestion, parseQuestion } from '../services/chat.js'

export function chatRouter() {
  const router = Router()

  router.post('/', async (req, res, next) => {
    try {
      const question = parseQuestion(req.body)
      return ok(res, await answerQuestion(question), getTraceId(req))
    } catch (error) {
      return next(error)
    }
  })

  return router
}
