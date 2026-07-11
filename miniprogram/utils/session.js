const api = require('./api')

const STORAGE_KEY = 'scenic_session_id'
let runtimeSessionId = null

function cached() {
  try { return wx.getStorageSync(STORAGE_KEY) || null } catch (_) { return null }
}

function save(sessionId) {
  runtimeSessionId = sessionId || null
  try { wx.setStorageSync(STORAGE_KEY, sessionId) } catch (_) { /* storage unavailable */ }
}

async function ensure() {
  if (runtimeSessionId && !String(runtimeSessionId).startsWith('local-')) return runtimeSessionId
  const existing = cached()
  try {
    const data = await api.createSession('SA-001')
    const sessionId = data && (data.sessionId || data.id)
    if (sessionId) { save(sessionId); return sessionId }
  } catch (_) { /* offline fallback */ }
  const localId = existing || `local-${Date.now()}`
  save(localId)
  return localId
}

async function update(sessionId) { if (sessionId) save(sessionId) }
function clear() { runtimeSessionId = null; try { wx.removeStorageSync(STORAGE_KEY) } catch (_) { /* ignore */ } }

module.exports = { ensure, cached, save, update, clear }
