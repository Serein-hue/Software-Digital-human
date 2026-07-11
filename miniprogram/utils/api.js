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
const DEVTOOLS_BASE = 'http://127.0.0.1:8001/v1'
const LAN_BASE = 'http://192.168.1.116:8001/v1'
const TIMEOUT = 5000
let activeBaseUrl = ''

function getBaseUrls() {
  let override = ''
  let platform = ''
  try {
    override = wx.getStorageSync('business-api-base') || ''
    const info = wx.getDeviceInfo ? wx.getDeviceInfo() : wx.getSystemInfoSync()
    platform = info.platform || ''
  } catch (_) { /* use defaults */ }
  const defaults = platform === 'devtools' ? [DEVTOOLS_BASE, LAN_BASE] : [LAN_BASE, DEVTOOLS_BASE]
  return [override, activeBaseUrl, ...defaults].filter((item, index, list) => item && list.indexOf(item) === index)
}

function getBaseUrl() {
  return activeBaseUrl || getBaseUrls()[0]
}

// ── 基础请求 ──────────────────────────────────────────────────────────
function request(method, path, data) {
  const bases = getBaseUrls()
  return new Promise((resolve, reject) => {
    const attempt = (index, lastError) => {
      if (index >= bases.length) {
        reject(lastError || { code: -1, message: '网络不可达' })
        return
      }
      const baseUrl = bases[index]
      wx.request({
        url: baseUrl + path,
        method,
        data,
        timeout: TIMEOUT,
        header: { 'Content-Type': 'application/json' },
        success(res) {
          const body = res.data
          if (body && body.code === 0) {
            activeBaseUrl = baseUrl
            resolve(body.data)
            return
          }
          if (res.statusCode >= 500 && index + 1 < bases.length) {
            attempt(index + 1, body)
            return
          }
          console.warn(`[API] ${method} ${path} failed:`, body)
          reject(body || { code: res.statusCode || -1, message: '接口异常' })
        },
        fail(err) {
          console.warn(`[API] ${method} ${path} via ${baseUrl} failed`)
          attempt(index + 1, { code: -1, message: '网络不可达', raw: err })
        },
      })
    }
    attempt(0)
  })
}

function GET(path) { return request('GET', path) }
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

/** 景区地图点位 */
function getMapPois() {
  return GET('/map/pois').then(unwrap)
}

/** 天气 */
function getWeather() {
  return GET('/weather')
}

/** 排队 */
function getQueues() {
  return GET('/queues')
}

function getTicketProducts() {
  return GET('/tickets/products').then(unwrap)
}

function createEmergency(data) {
  return POST('/emergency/requests', data)
}

function submitFeedback(sessionId, data) {
  return POST('/sessions/' + sessionId + '/feedback', data)
}

function probe() {
  return getWeather().then(() => ({ online: true, baseUrl: getBaseUrl() }))
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

module.exports = {
  // 基础
  request,
  getBaseUrl,
  probe,
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
  getMapPois,
  getWeather,
  getQueues,
  getTicketProducts,
  createEmergency,
  submitFeedback,
}
