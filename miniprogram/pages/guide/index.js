const { SPOTS, MOCK_KNOWLEDGE, QUICK_ACTIONS } = require('../../utils/data')

const VOICE_SUGGESTIONS = ['灵山大佛有多高？', '帮我推荐一条路线', '九龙灌浴每天几场表演？']

Page({
  data: {
    messages: [],
    inputText: '',
    isSpeaking: false,
    isListening: false,
    isOffline: false,
    voiceOpen: false,
    voiceRecording: false,
    scrollToId: '',
    quickActions: QUICK_ACTIONS,
    voiceSuggestions: VOICE_SUGGESTIONS,
  },

  onLoad() {
    this.setData({
      messages: [{
        id: 'welcome',
        role: 'guide',
        text: '欢迎来到灵山胜境！我是您的 AI 导游小景。您可以随时向我提问，比如"灵山大佛有多高？"或者"推荐一条游览路线"。',
      }],
    })

    this.recorderManager = wx.getRecorderManager()
    this.recorderManager.onStop((res) => {
      this.setData({ voiceRecording: false })
      if (res.tempFilePath) {
        this.setData({ voiceOpen: false })
        // Mock recognition result — real implementation would upload to ASR service
        this.setData({ inputText: '给我介绍一下灵山胜境' }, () => this.onSend())
      }
    })
    this.recorderManager.onError(() => {
      this.setData({ voiceRecording: false })
      wx.showToast({ title: '录音失败，请重试', icon: 'none' })
    })

    this.speakingTimer = null
    this.listeningTimer = null
  },

  onUnload() {
    if (this.speakingTimer) clearTimeout(this.speakingTimer)
    if (this.listeningTimer) clearTimeout(this.listeningTimer)
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },

  onSend() {
    const text = this.data.inputText.trim()
    if (!text) return

    if (this.listeningTimer) clearTimeout(this.listeningTimer)
    if (this.speakingTimer) clearTimeout(this.speakingTimer)

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text }
    const messages = [...this.data.messages, userMsg]
    this.setData({ messages, inputText: '', isListening: true, scrollToId: `msg-${userMsg.id}` })

    this.listeningTimer = setTimeout(() => {
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

      this.speakingTimer = setTimeout(() => this.setData({ isSpeaking: false }), matched.text.length * 35)
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
    this.setData({ voiceOpen: true, voiceRecording: false })
  },

  closeVoice() {
    this.setData({ voiceOpen: false })
    if (this.recorderManager) {
      try { this.recorderManager.stop() } catch (e) { /* not recording */ }
    }
  },

  startVoiceRecord() {
    this.setData({ voiceRecording: true })
    this.recorderManager.start({
      duration: 10000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3',
    })
  },

  stopVoiceRecord() {
    this.recorderManager.stop()
  },

  openCamera() {
    wx.navigateTo({ url: '/pages/photo/index' })
  },

  openShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    })
  },

  onShareAppMessage() {
    return {
      title: '灵山胜境 · AI 导游',
      path: '/pages/guide/index',
    }
  },

  onVoiceResult(e) {
    const text = e.currentTarget.dataset.text
    this.setData({ voiceOpen: false }, () => {
      this.onSendText(text)
    })
  },

  onPullDownRefresh() {
    wx.showModal({
      title: '确认',
      content: '确定要清空对话记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            messages: [{
              id: 'welcome',
              role: 'guide',
              text: '欢迎来到灵山胜境！我是您的 AI 导游小景。',
            }],
          })
        }
        wx.stopPullDownRefresh()
      },
    })
  },
})
