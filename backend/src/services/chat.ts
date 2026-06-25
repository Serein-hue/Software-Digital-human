import { KNOWLEDGE_BASE, SPOTS } from '../data.js'
import { badRequest } from '../http/errors.js'

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL ?? 'http://127.0.0.1:5010'

export type ChatResult = {
  answer: string
  source: string
  confidence: 'high' | 'medium' | 'low'
}

export function parseQuestion(body: unknown): string {
  if (!body || typeof body !== 'object' || !('question' in body)) {
    throw badRequest('question is required')
  }

  const question = (body as { question: unknown }).question
  if (typeof question !== 'string') {
    throw badRequest('question is required')
  }

  const trimmed = question.trim()
  if (!trimmed) {
    throw badRequest('question is required')
  }

  return trimmed
}

async function queryRag(question: string): Promise<ChatResult | null> {
  try {
    const resp = await fetch(`${RAG_SERVICE_URL}/api/v1/rag/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: question, top_k: 3 }),
      signal: AbortSignal.timeout(5000),
    })
    if (!resp.ok) return null

    const body = await resp.json()
    if (body.code !== 0 || !body.data) return null

    const { answerable, contexts } = body.data
    if (!answerable || !contexts || contexts.length === 0) return null

    const topCtx = contexts[0]
    const answer = contexts.map((c: { quote?: string; text?: string }) => c.quote ?? c.text ?? '').join('\n\n')
    const score = topCtx.score ?? 0
    const confidence: ChatResult['confidence'] = score >= 0.8 ? 'high' : score >= 0.5 ? 'medium' : 'low'
    return { answer, source: topCtx.source_name ?? 'local-rag', confidence }
  } catch {
    return null
  }
}

function findKnowledgeAnswer(question: string): ChatResult | null {
  if (KNOWLEDGE_BASE[question]) {
    return {
      answer: KNOWLEDGE_BASE[question].text,
      source: KNOWLEDGE_BASE[question].source,
      confidence: 'high',
    }
  }

  if (question.length >= 2) {
    for (const [key, value] of Object.entries(KNOWLEDGE_BASE)) {
      if (key === 'default') continue
      const queryPrefix = question.slice(0, 4)
      const keyPrefix = key.slice(0, 4)
      if (queryPrefix && keyPrefix && (question.includes(keyPrefix) || key.includes(queryPrefix))) {
        return { answer: value.text, source: value.source, confidence: 'medium' }
      }
    }
  }

  for (const spot of SPOTS) {
    if (question.includes(spot.name)) {
      return { answer: spot.shortIntro, source: spot.source, confidence: 'medium' }
    }
  }

  return null
}

export async function answerQuestion(question: string): Promise<ChatResult> {
  const ragResult = await queryRag(question)
  if (ragResult) return ragResult

  const localAnswer = findKnowledgeAnswer(question)
  if (localAnswer) return localAnswer

  return {
    answer: KNOWLEDGE_BASE.default.text,
    source: KNOWLEDGE_BASE.default.source,
    confidence: 'low',
  }
}
