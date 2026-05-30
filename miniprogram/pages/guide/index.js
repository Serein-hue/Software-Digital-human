const { SPOTS, MOCK_KNOWLEDGE, QUICK_ACTIONS } = require('../../utils/data')
const { t, getLang, toggleLang, getSuggestions } = require('../../utils/i18n')

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
    voiceSuggestions: [],
    langLabel: 'EN',
    // Display strings
    guideTitle: '',
    guideWelcome: '',
    guideWelcomeShort: '',
    guideOffline: '',
    guideSpeaking: '',
    guideListening: '',
    guidePlace: '',
    guidePhoto: '',
    guideSend: '',
    guideInputPlaceholder: '',
    voiceRecordingLabel: '',
    voiceTapStartLabel: '',
    voiceRecordingHint: '',
    voiceIdleHint: '',
    voiceSuggestionsLabel: '',
  },

  refreshDisplay() {
    this.setData({
      guideTitle: t('guide.title'),
      guideWelcome: t('guide.welcome'),
      guideWelcomeShort: t('guide.welcomeShort'),
      guideOffline: t('guide.offline'),
      guideSpeaking: t('guide.speaking'),
      guideListening: t('guide.listening'),
      guidePlace: t('guide.place'),
      guidePhoto: t('guide.photo'),
      guideSend: t('guide.send'),
      guideInputPlaceholder: t('guide.inputPlaceholder'),
      voiceRecordingLabel: t('voice.recording'),
      voiceTapStartLabel: t('voice.tapStart'),
      voiceRecordingHint: t('voice.recordingHint'),
      voiceIdleHint: t('voice.idleHint'),
      voiceSuggestionsLabel: t('voice.suggestions'),
      voiceSuggestions: getSuggestions(),
      langLabel: getLang() === 'zh' ? 'EN' : '中文',
    })
  },

  onLoad() {
    this.refreshDisplay()
    this.setData({
      messages: [{
        id: 'welcome',
        role: 'guide',
        text: t('guide.welcome'),
      }],
    })

    this.recorderManager = wx.getRecorderManager()
    this.recorderManager.onStop((res) => {
      this.setData({ voiceRecording: false })
      if (res.tempFilePath) {
        this.setData({ voiceOpen: false })
        this.setData({ inputText: '给我介绍一下灵山胜境' }, () => this.onSend())
      }
    })
    this.recorderManager.onError(() => {
      this.setData({ voiceRecording: false })
      wx.showToast({ title: t('voice.recordingError'), icon: 'none' })
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

  toggleLanguage() {
    toggleLang()
    this.refreshDisplay()
    this.setData({
      messages: [{
        id: 'welcome',
        role: 'guide',
        text: t('guide.welcome'),
      }],
    })
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
      title: t('share.title'),
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
      title: t('guide.confirm'),
      content: t('guide.confirmClear'),
      success: (res) => {
        if (res.confirm) {
          this.setData({
            messages: [{
              id: 'welcome',
              role: 'guide',
              text: t('guide.welcomeShort'),
            }],
          })
        }
        wx.stopPullDownRefresh()
      },
    })
  },
})
