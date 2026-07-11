const { SPOTS, MOCK_KNOWLEDGE } = require('../../utils/data')
const { t, getSuggestions } = require('../../utils/i18n')
const api = require('../../utils/api')
const session = require('../../utils/session')
const { lightFeedback } = require('../../utils/motion')

const PRIMARY_ACTIONS = [
  { action: 'route', i18nKey: 'quick.route', glyphKey: 'quick.routeGlyph', askText: '推荐路线' },
  { action: 'camera', i18nKey: 'quick.camera', glyphKey: 'quick.cameraGlyph', askText: '拍照识景' },
  { action: 'detail', i18nKey: 'quick.detail', glyphKey: 'quick.detailGlyph', askText: '深度讲解' },
  { action: 'services', i18nKey: 'quick.services', glyphKey: 'quick.servicesGlyph', askText: '服务设施' },
]

Page({
  data: {
    messages: [],
    inputText: '',
    isSpeaking: false,
    isListening: false,
    isOffline: false,
    apiConnected: false,
    voiceOpen: false,
    voiceRecording: false,
    scrollToId: '',
    quickActions: [],
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
    // 服务状态
    _sessionId: null,  // 当前会话 ID
    _apiOnline: false, // business-api 是否可达
  },

  refreshDisplay() {
    this.setData({
      guideTitle: t('guide.title'),
      brandOverline: t('guide.brandOverline'),
      contextEyebrow: t('guide.contextEyebrow'),
      contextTitle: t('guide.contextTitle'),
      contextSubtitle: t('guide.contextSubtitle'),
      weatherNow: t('guide.weatherNow'),
      nextShowValue: t('guide.nextShowValue'),
      todayPlanLabel: t('guide.todayPlan'),
      nextShowLabel: t('guide.nextShow'),
      nextShowName: t('guide.nextShowName'),
      planRouteLabel: t('guide.planRoute'),
      chatEyebrow: t('guide.chatEyebrow'),
      chatTitle: t('guide.chatTitle'),
      onlineServiceLabel: t('guide.onlineService'),
      cachedServiceLabel: t('guide.cachedService'),
      navGuideLabel: t('guide.navGuide'),
      navRouteLabel: t('guide.navRoute'),
      navServicesLabel: t('guide.navServices'),
      navEmergencyLabel: t('guide.navEmergency'),
      networkOnlineLabel: t('guide.networkOnline'),
      networkOfflineLabel: t('guide.networkOffline'),
      avatarName: t('guide.avatarName'),
      avatarIdle: t('guide.avatarIdle'),
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
      toggleOfflineAria: t('guide.toggleOffline'),
      shareAria: t('guide.share'),
      quickActions: PRIMARY_ACTIONS.map((item) => ({
        ...item,
        glyph: t(item.glyphKey),
        label: t(item.i18nKey),
      })),
    })
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 0, switching: false })
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

    // 尝试连接 business-api，创建会话
    this._initSession()

    this.recorderManager = wx.getRecorderManager()
    this.recorderManager.onStop((res) => {
      this.setData({ voiceRecording: false })
      if (res.tempFilePath) {
        this.setData({ voiceOpen: false })
        this.setData({ inputText: t('voice.mockResult') }, () => this.onSend())
      }
    })
    this.recorderManager.onError(() => {
      this.setData({ voiceRecording: false })
      wx.showToast({ title: t('voice.recordingError'), icon: 'none' })
    })

    this.speakingTimer = null
    this.listeningTimer = null
  },

  // ── 初始化会话 ────────────────────────────────────────────────────
  _initSession() {
    api.createSession('SA-001').then((data) => {
      const sessionId = data && (data.id || data.sessionId)
      if (sessionId) {
        this.data._sessionId = sessionId
        this.data._apiOnline = true
        console.log('[Guide] API session created:', sessionId)
      }
    }).catch(() => {
      // API 不可达，使用本地 mock
      this.data._apiOnline = false
      console.log('[Guide] API offline, using local mock')
    })
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

    const sessionId = this.data._sessionId
    if (sessionId && this.data._apiOnline) {
      // 走 API：发送消息到 business-api
      api.sendMessage(sessionId, text).then((data) => {
        this.setData({ isListening: false })
        // API 返回的消息数组
        const replies = Array.isArray(data) ? data : (data && data.items ? data.items : [data])
        const lastReply = Array.isArray(replies) ? replies[replies.length - 1] : replies
        const replyText = (lastReply && (lastReply.content || lastReply.text || lastReply.answer)) || ''
        if (replyText) {
          this._showGuideResponse(replyText, lastReply.source || t('guide.sourceOfficial'))
        } else {
          // API 无回复，走本地 mock
          this._localAnswer(text)
        }
      }).catch(() => {
        // API 失败，回退本地
        this.setData({ isListening: false })
        this._localAnswer(text)
      })
    } else {
      // 本地 mock 回答
      setTimeout(() => {
        this.setData({ isListening: false })
        this._localAnswer(text)
      }, 600)
    }
  },

  // ── 本地 mock 回答 ────────────────────────────────────────────────
  _localAnswer(text) {
    const matched = MOCK_KNOWLEDGE[text]
      || Object.entries(MOCK_KNOWLEDGE).find(([key]) => text.includes(key.slice(0, 4)))?.[1]
      || MOCK_KNOWLEDGE.default
    this._showGuideResponse(matched.text, matched.source)
  },

  _showGuideResponse(text, source) {
    this.setData({ isSpeaking: true })
    const guideMsg = {
      id: `g-${Date.now()}`,
      role: 'guide',
      text,
      source: source || t('guide.sourceOfficial'),
    }
    const updated = [...this.data.messages, guideMsg]
    this.setData({ messages: updated, scrollToId: `msg-${guideMsg.id}` })

    this.speakingTimer = setTimeout(() => this.setData({ isSpeaking: false }), text.length * 35)
  },

  onQuickAction(e) {
    lightFeedback()
    const { action, askText } = e.currentTarget.dataset
    if (action === 'route') {
      wx.navigateTo({ url: '/pages/route/index' })
    } else if (action === 'camera') {
      wx.navigateTo({ url: '/pages/photo/index' })
    } else if (action === 'detail') {
      wx.navigateTo({ url: '/pages/spot-detail/index?id=lingshan-buddha' })
    } else if (action === 'ask') {
      this.onSendText(askText)
    }
  },

  onSendText(text) {
    this.setData({ inputText: text }, () => this.onSend())
  },

  goPrimaryNav(e) {
    const target = e.currentTarget.dataset.target
    if (target === 'guide') return
    if (target === 'route') wx.navigateTo({ url: '/pages/route/index' })
    if (target === 'services') wx.navigateTo({ url: '/pages/services/index' })
    if (target === 'emergency') wx.navigateTo({ url: '/pages/emergency/index' })
  },

  toggleOffline() {
    this.setData({ isOffline: !this.data.isOffline })
  },

  noop() {},

  openVoice() {
    lightFeedback()
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
