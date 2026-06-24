/**
 * HTTP Client — 封装 wx.request，统一处理 business-api 响应格式
 *
 * 响应信封: { code: 0, message: "success", data: {...}, trace_id: "..." }
 *   - code === 0  → resolve(data)
 *   - code !== 0  → reject({ code, message, trace_id })
 *
 * 用法:
 *   const api = require('../../utils/api')
 *   const spots = await api.get('/spots', { limit: 3 })
 *   const result = await api.post('/rag/query', { query: '...' })
 */

// 开发环境默认地址，生产环境通过 env 或配置注入
const DEFAULT_BASE_URL = 'http://localhost:8001/v1'

let _baseUrl = DEFAULT_BASE_URL

/**
 * 设置 API 基础地址（可在 app.js onLaunch 中调用）
 */
function setBaseUrl(url) {
  _baseUrl = url
}

/**
 * 获取当前 API 基础地址
 */
function getBaseUrl() {
  return _baseUrl
}

/**
 * 核心请求方法
 */
function request(method, path, data, options = {}) {
  const url = _baseUrl + path

  // GET 请求将 data 转为 query string
  let finalUrl = url
  if (method === 'GET' && data) {
    const params = Object.entries(data)
      .filter(([, v]) => v != null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&')
    if (params) finalUrl += '?' + params
  }

  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    wx.request({
      url: finalUrl,
      method,
      data: method === 'GET' ? undefined : data,
      header: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: options.timeout || 15000,
      success(res) {
        const elapsed = Date.now() - startTime
        const body = res.data

        if (!body || typeof body.code === 'undefined') {
          // 非标准响应（可能是网关错误页）
          reject({
            code: -1,
            message: '服务响应异常',
            trace_id: '',
            elapsed,
          })
          return
        }

        if (body.code === 0) {
          resolve(body.data)
        } else {
          reject({
            code: body.code,
            message: body.message || '未知错误',
            trace_id: body.trace_id || '',
            elapsed,
          })
        }

        // 开发环境打印请求日志
        if (options.debug !== false) {
          console.log(`[api] ${method} ${path} → ${body.code} (${elapsed}ms)`)
        }
      },
      fail(err) {
        reject({
          code: -1,
          message: '网络连接失败，请检查网络',
          trace_id: '',
          detail: err,
        })
      },
    })
  })
}

/**
 * GET 请求
 */
function get(path, params, options) {
  return request('GET', path, params, options)
}

/**
 * POST 请求
 */
function post(path, data, options) {
  return request('POST', path, data, options)
}

/**
 * PATCH 请求
 */
function patch(path, data, options) {
  return request('PATCH', path, data, options)
}

module.exports = {
  get,
  post,
  patch,
  setBaseUrl,
  getBaseUrl,
}
