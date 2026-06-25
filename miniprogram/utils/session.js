const STORAGE_KEY = 'scenic_session_id'

function cached() {
  try {
    return wx.getStorageSync(STORAGE_KEY) || null
  } catch (_) {
    return null
  }
}

function save(sessionId) {
  try {
    wx.setStorageSync(STORAGE_KEY, sessionId)
  } catch (_) {
    // Ignore storage quota errors. The app can still run without persistence.
  }
}

async function ensure() {
  const existing = cached()
  if (existing) return existing

  const sessionId = `local-${Date.now()}`
  save(sessionId)
  return sessionId
}

async function update(sessionId) {
  if (sessionId) save(sessionId)
}

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
