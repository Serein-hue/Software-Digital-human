function lightFeedback() {
  try { wx.vibrateShort({ type: 'light' }) } catch (_) { /* unsupported */ }
}

module.exports = { lightFeedback }
