import { createApp } from './app.js'

const PORT = process.env.PORT ?? 3001
const app = createApp()

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
