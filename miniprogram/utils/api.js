/**
 * API 层 — 对接 business-api (:8001)
 *
 * 用法:
 *   const api = require('../../utils/api')
 *   api.getSpots().then(data => ...)
 *
 * 所有 API 返回格式: { code: 0, message: 'success', data: ..., trace_id: '...' }
 * data 可能是数组({items})，也可能是普通对象。
 */

// ── 配置 ──────────────────────────────────────────────────────────────
// 开发时改成你电脑的局域网 IP，让手机也能连
const BASE_URL = 'http://192.168.43.30:8001/v1'
const TIMEOUT = 8000

// ── 基础请求 ──────────────────────────────────────────────────────────

function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + path
    wx.request({
      url,
      method,
      data,
      timeout: TIMEOUT,
      header: { 'Content-Type': 'application/json' },
      success(res) {
        const body = res.data
        if (body && body.code === 0) {
          resolve(body.data)
        } else {
          console.warn(`[API] ${method} ${path} failed:`, body)
          reject(body || { code: -1, message: '网络异常' })
        }
      },
      fail(err) {
        console.warn(`[API] ${method} ${path} network error:`, err)
        // 业务方自己处理 fallback
        reject({ code: -1, message: '网络不可达', raw: err })
      },
    })
  })
}

function GET(path)  { return request('GET', path) }
function POST(path, data) { return request('POST', path, data) }

// ── 提取分页包装中的 items ────────────────────────────────────────────

function unwrap(data) {
  // data 可能是 { items: [...], pagination: {...} }
  // 也可能是直接数组，也可能是直接对象
  if (data && typeof data === 'object' && Array.isArray(data.items)) {
    return data.items
  }
  return data
}

// ═══════════════════════════════════════════════════════════════════════
// 景点
// ═══════════════════════════════════════════════════════════════════════

/** 景点列表 */
function getSpots(params = {}) {
  return GET('/spots').then(unwrap)
}

/** 单个景点详情 */
function getSpotDetail(spotId) {
  return GET(`/spots/${spotId}`)
}

/** 景点讲解词 */
function getSpotGuide(spotId) {
  return GET(`/spots/${spotId}/guide`)
}

// ═══════════════════════════════════════════════════════════════════════
// 路线
// ═══════════════════════════════════════════════════════════════════════

/** 路线列表 */
function getRoutes(params = {}) {
  return GET('/routes').then(unwrap)
}

/** 路线详情 */
function getRouteDetail(routeId) {
  return GET(`/routes/${routeId}`)
}

// ═══════════════════════════════════════════════════════════════════════
// 会话 & 消息（AI 对话）
// ═══════════════════════════════════════════════════════════════════════

/** 创建新会话 */
function createSession(scenicId) {
  return POST('/sessions', { scenicId: scenicId || 'SA-001' })
}

/** 发送消息（提问） */
function sendMessage(sessionId, text) {
  return POST(`/sessions/${sessionId}/messages`, { role: 'user', text })
}

/** 获取消息历史 */
function getMessages(sessionId, limit = 50) {
  return GET(`/sessions/${sessionId}/messages?limit=${limit}`)
}

// ═══════════════════════════════════════════════════════════════════════
// 公共
// ═══════════════════════════════════════════════════════════════════════

/** 公告列表 */
function getNotices() {
  return GET('/notices').then(unwrap)
}

/** 活动列表 */
function getEvents() {
  return GET('/events').then(unwrap)
}

/** 服务设施 */
function getServices() {
  return GET('/services').then(unwrap)
}

/** 天气 */
function getWeather() {
  return GET('/weather')
}

/** 排队 */
function getQueues() {
  return GET('/queues')
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

module.exports = {
  // 基础
  request,
  BASE_URL,
  // 景点
  getSpots,
  getSpotDetail,
  getSpotGuide,
  // 路线
  getRoutes,
  getRouteDetail,
  // 会话
  createSession,
  sendMessage,
  getMessages,
  // 公共
  getNotices,
  getEvents,
  getServices,
  getWeather,
  getQueues,
}
