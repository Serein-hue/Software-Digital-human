/**
 * Session 管理 — 创建/恢复游客会话
 *
 * 会话用于:
 *   - 多轮对话上下文 (guide 页)
 *   - 消息历史记录
 *   - 到达事件追踪
 *   - 反馈关联
 *
 * 用法:
 *   const session = require('../../utils/session')
 *   const sid = await session.ensure()
 *   // 或同步获取已缓存的 ID
 *   const sid = session.cached()
 */

const api = require('./api')

const STORAGE_KEY = 'scenic_session_id'

/**
 * 从本地存储读取已缓存的 sessionId（同步，不发起网络请求）
 * @returns {string|null}
 */
function cached() {
  try {
    return wx.getStorageSync(STORAGE_KEY) || null
  } catch (_) {
    return null
  }
}

/**
 * 保存 sessionId 到本地存储
 */
function save(sessionId) {
  try {
    wx.setStorageSync(STORAGE_KEY, sessionId)
  } catch (_) {
    // 存储满了也忽略
  }
}

/**
 * 确保有可用的 session：
 *   1. 本地有缓存 → 尝试 GET /sessions/{id} 验证有效性
 *   2. 缓存无效或不存在 → POST /sessions 创建新的
 *
 * @param {object} [opts]
 * @param {string} [opts.source='miniprogram']
 * @param {string} [opts.language='zh']
 * @returns {Promise<string>} sessionId
 */
async function ensure(opts = {}) {
  const existing = cached()

  // 验证已有 session 是否还有效
  if (existing) {
    try {
      await api.get(`/sessions/${existing}`)
      return existing
    } catch (e) {
      // session 过期或服务重启，创建新的
      console.log('[session] 旧会话已失效，重新创建', e.message)
    }
  }

  // 创建新 session
  try {
    const data = await api.post('/sessions', {
      source: opts.source || 'miniprogram',
      language: opts.language || 'zh',
    })
    const sessionId = data.sessionId
    save(sessionId)
    console.log('[session] 新会话已创建:', sessionId)
    return sessionId
  } catch (e) {
    console.error('[session] 创建会话失败:', e.message)
    // 生成本地 fallback ID，离线也能用
    const fallbackId = 'local-' + Date.now()
    save(fallbackId)
    return fallbackId
  }
}

/**
 * 更新会话状态（当前位置、当前路线等）
 */
async function update(sessionId, patch) {
  try {
    await api.patch(`/sessions/${sessionId}`, patch)
  } catch (e) {
    console.log('[session] 更新会话状态失败:', e.message)
  }
}

/**
 * 清除本地会话（用户主动退出/清空对话时调用）
 */
function clear() {
  try {
    wx.removeStorageSync(STORAGE_KEY)
  } catch (_) {
    // ignore
  }
}

module.exports = {
  ensure,
  cached,
  save,
  update,
  clear,
}
