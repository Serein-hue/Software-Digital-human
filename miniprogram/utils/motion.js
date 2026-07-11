function playPageEnter(page) {
  if (!page || typeof wx === 'undefined' || !wx.createAnimation) return
  const reset = wx.createAnimation({ duration: 0 })
  reset.opacity(0.94).translateY(10).step()
  page.setData({ pageAnimation: reset.export() }, () => {
    const enter = wx.createAnimation({ duration: 260, timingFunction: 'ease-out' })
    enter.opacity(1).translateY(0).step()
    page.setData({ pageAnimation: enter.export() })
  })
}

function lightFeedback() {
  try { wx.vibrateShort({ type: 'light' }) } catch (_) { /* unsupported */ }
}

module.exports = { playPageEnter, lightFeedback }
