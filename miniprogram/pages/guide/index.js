const { SPOTS, MOCK_KNOWLEDGE, QUICK_ACTIONS } = require('../../utils/data')

Page({
  data: {
    messages: [],
    inputText: '',
    isSpeaking: false,
    isListening: false,
    isOffline: false,
    voiceOpen: false,
    scrollToId: '',
    quickActions: QUICK_ACTIONS,
  },

  onLoad() {
    this.setData({
      messages: [{
        id: 'welcome',
        role: 'guide',
        text: '欢迎来到灵山胜境！我是您的 AI 导游小景。您可以随时向我提问，比如"灵山大佛有多高？"或者"推荐一条游览路线"。',
      }],
    })
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },

  onSend() {
    const text = this.data.inputText.trim()
    if (!text) return

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text }
    const messages = [...this.data.messages, userMsg]
    this.setData({ messages, inputText: '', isListening: true, scrollToId: `msg-${userMsg.id}` })

    setTimeout(() => {
      const matched = MOCK_KNOWLEDGE[text]
        || Object.entries(MOCK_KNOWLEDGE).find(([key]) => text.includes(key.slice(0, 4)))?.[1]
        || MOCK_KNOWLEDGE.default

      this.setData({ isListening: false, isSpeaking: true })

      const guideMsg = {
        id: `g-${Date.now()}`,
        role: 'guide',
        text: matched.text,
        source: matched.source,
      }
      const updated = [...this.data.messages, guideMsg]
      this.setData({ messages: updated, scrollToId: `msg-${guideMsg.id}` })

      setTimeout(() => this.setData({ isSpeaking: false }), matched.text.length * 35)
    }, 800)
  },

  onQuickAction(e) {
    const { action, label } = e.currentTarget.dataset
    if (action === 'route') {
      wx.navigateTo({ url: '/pages/route/index' })
    } else if (action === 'camera') {
      wx.navigateTo({ url: '/pages/photo/index' })
    } else if (action === 'detail') {
      wx.navigateTo({ url: '/pages/spot-detail/index?id=lingshan-buddha' })
    } else if (action === 'ask') {
      this.onSendText(label)
    }
  },

  onSendText(text) {
    this.setData({ inputText: text }, () => this.onSend())
  },

  toggleOffline() {
    this.setData({ isOffline: !this.data.isOffline })
  },

  openVoice() {
    this.setData({ voiceOpen: true })
  },

  closeVoice() {
    this.setData({ voiceOpen: false })
  },

  openCamera() {
    wx.navigateTo({ url: '/pages/photo/index' })
  },

  openShare() {
    // Mini program share triggered by button open-type="share" or wx.showShareMenu
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    })
  },

  onVoiceResult(e) {
    const text = e.currentTarget.dataset.text
    this.setData({ voiceOpen: false }, () => {
      this.onSendText(text)
    })
  },

  // Pull to refresh
  onPullDownRefresh() {
    this.setData({
      messages: [{
        id: 'welcome',
        role: 'guide',
        text: '欢迎来到灵山胜境！我是您的 AI 导游小景。',
      }],
    })
    wx.stopPullDownRefresh()
  },
})
