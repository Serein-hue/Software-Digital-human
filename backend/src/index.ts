import express from 'express'
import cors from 'cors'
import { SPOTS, SPOT_MAP, ROUTES, KNOWLEDGE_BASE, ANALYTICS } from './data.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

// ── Spots ──

app.get('/api/spots', (_req, res) => {
  const summary = SPOTS.map(({ id, name, category, location, shortIntro, heroGradient }) => ({
    id, name, category, location, shortIntro, heroGradient,
  }))
  res.json(summary)
})

app.get('/api/spots/:id', (req, res) => {
  const spot = SPOT_MAP[req.params.id]
  if (!spot) return res.status(404).json({ error: 'Spot not found' })
  res.json(spot)
})

app.get('/api/spots/:id/related', (req, res) => {
  const spot = SPOT_MAP[req.params.id]
  if (!spot) return res.status(404).json({ error: 'Spot not found' })
  const related = spot.related.map((id) => {
    const s = SPOT_MAP[id]
    return s ? { id: s.id, name: s.name, category: s.category, shortIntro: s.shortIntro } : null
  }).filter(Boolean)
  res.json(related)
})

// ── Routes ──

app.get('/api/routes', (_req, res) => {
  res.json(ROUTES)
})

app.get('/api/routes/:id', (req, res) => {
  const route = ROUTES.find((r) => r.id === req.params.id)
  if (!route) return res.status(404).json({ error: 'Route not found' })
  res.json(route)
})

// ── Chat / QA (RAG 优先，失败后降级到字典匹配) ──

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL ?? 'http://127.0.0.1:5010'

async function queryRag(question: string): Promise<{ answer: string; source: string; confidence: 'high' | 'medium' | 'low' } | null> {
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

    // 拼接多个上下文为回答
    const topCtx = contexts[0]
    const answer = contexts.map((c: { quote?: string; text?: string }) => c.quote ?? c.text ?? '').join('\n\n')
    const score = topCtx.score ?? 0
    const confidence: 'high' | 'medium' | 'low' = score >= 0.8 ? 'high' : score >= 0.5 ? 'medium' : 'low'
    return { answer, source: topCtx.source_name ?? '灵山知识库', confidence }
  } catch {
    return null
  }
}

app.post('/api/chat', async (req, res) => {
  const { question } = req.body ?? {}
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'question is required' })
  }

  const q = question.trim()

  // 1. Try RAG first
  const ragResult = await queryRag(q)
  if (ragResult) {
    return res.json(ragResult)
  }

  // 2. Fallback: KNOWLEDGE_BASE exact match
  if (KNOWLEDGE_BASE[q]) {
    return res.json({ answer: KNOWLEDGE_BASE[q].text, source: KNOWLEDGE_BASE[q].source, confidence: 'high' })
  }

  // 3. Partial key match
  for (const [key, value] of Object.entries(KNOWLEDGE_BASE)) {
    if (key === 'default') continue
    if (q.includes(key.slice(0, 4)) || key.includes(q.slice(0, 4))) {
      return res.json({ answer: value.text, source: value.source, confidence: 'medium' })
    }
  }

  // 4. Spot name match
  for (const spot of SPOTS) {
    if (q.includes(spot.name)) {
      return res.json({ answer: spot.shortIntro, source: spot.source, confidence: 'medium' })
    }
  }

  // 5. Default fallback
  res.json({ answer: KNOWLEDGE_BASE.default.text, source: KNOWLEDGE_BASE.default.source, confidence: 'low' })
})

// ── Analytics ──

app.get('/api/analytics', (_req, res) => {
  res.json(ANALYTICS)
})

app.get('/api/analytics/realtime', (_req, res) => {
  res.json({
    currentVisitors: ANALYTICS.todayVisitors,
    trend: ANALYTICS.weekTrend,
    alerts: ANALYTICS.alerts,
    facilityStatus: ANALYTICS.facilityStatus,
  })
})

// ── Health ──

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

app.listen(PORT, () => {
  console.log(`灵山胜境 API running at http://localhost:${PORT}`)
  console.log(`  GET  /api/spots          — 景点列表`)
  console.log(`  GET  /api/spots/:id      — 景点详情`)
  console.log(`  GET  /api/spots/:id/related — 相关景点`)
  console.log(`  GET  /api/routes         — 游览路线`)
  console.log(`  GET  /api/routes/:id     — 路线详情`)
  console.log(`  POST /api/chat           — AI 问答`)
  console.log(`  GET  /api/analytics      — 运营数据`)
  console.log(`  GET  /api/analytics/realtime — 实时数据`)
  console.log(`  GET  /api/health         — 健康检查`)
})

export default app
