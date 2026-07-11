const api = require('./api')

const STORAGE_KEY = 'scenic_session_id'

function cached() {
  try { return wx.getStorageSync(STORAGE_KEY) || null } catch (_) { return null }
}

function save(sessionId) {
  try { wx.setStorageSync(STORAGE_KEY, sessionId) } catch (_) { /* storage unavailable */ }
}

async function ensure() {
  const existing = cached()
  if (existing && !String(existing).startsWith('local-')) return existing
  try {
    const data = await api.createSession('SA-001')
    const sessionId = data && (data.sessionId || data.id)
    if (sessionId) { save(sessionId); return sessionId }
  } catch (_) { /* offline fallback */ }
  const localId = `local-${Date.now()}`
  save(localId)
  return localId
}

async function update(sessionId) { if (sessionId) save(sessionId) }
function clear() { try { wx.removeStorageSync(STORAGE_KEY) } catch (_) { /* ignore */ } }

module.exports = { ensure, cached, save, update, clear }
