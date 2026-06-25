const { MOCK_KNOWLEDGE, QUICK_ACTIONS } = require('../../utils/data')
const { t, getLang, toggleLang, getSuggestions } = require('../../utils/i18n')
const api = require('../../utils/api')
const session = require('../../utils/session')

Page({
  data: {
    messages: [],
    inputText: '',
    isSpeaking: false,
    isListening: false,
    isOffline: false,
    isLoading: false,
    voiceOpen: false,
    voiceRecording: false,
    scrollToId: '',
    quickActions: [],
    voiceSuggestions: [],
    langLabel: 'EN',
    guideTitle: '', guideWelcome: '', guideWelcomeShort: '',
    guideOffline: '', guideSpeaking: '', guideListening: '',
    guidePlace: '', guidePhoto: '', guideSend: '',
    guideInputPlaceholder: '',
    voiceRecordingLabel: '', voiceTapStartLabel: '',
    voiceRecordingHint: '', voiceIdleHint: '', voiceSuggestionsLabel: '',
    onlineServices: '', onlineTickets: '',
  },

  refreshDisplay() {
    this.setData({
      guideTitle: t('guide.title'), guideWelcome: t('guide.welcome'),
      guideWelcomeShort: t('guide.welcomeShort'), guideOffline: t('guide.offline'),
      guideSpeaking: t('guide.speaking'), guideListening: t('guide.listening'),
      guidePlace: t('guide.place'), guidePhoto: t('guide.photo'),
      guideSend: t('guide.send'), guideInputPlaceholder: t('guide.inputPlaceholder'),
      voiceRecordingLabel: t('voice.recording'), voiceTapStartLabel: t('voice.tapStart'),
      voiceRecordingHint: t('voice.recordingHint'), voiceIdleHint: t('voice.idleHint'),
      voiceSuggestionsLabel: t('voice.suggestions'), voiceSuggestions: getSuggestions(),
      langLabel: getLang() === 'zh' ? 'EN' : '中文',
      toggleOfflineAria: t('guide.toggleOffline'), shareAria: t('guide.share'),
      onlineServices: t('quick.services'), onlineTickets: t('quick.tickets'),
      quickActions: QUICK_ACTIONS.map((q) => ({ ...q, label: t(q.i18nKey) })),
    })
  },

  async onLoad(options) {
    this.refreshDisplay()

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

    await this.initSession()

    if (options && options.spotId) {
      setTimeout(() => {
        this.onSendText(`给我讲讲${options.spotName || '这个景点'}`)
      }, 500)
    }
  },

  async initSession() {
    try {
      this.sessionId = await session.ensure({ source: 'miniprogram' })
    } catch (e) {
      console.log('[guide] session init failed, using local session:', e.message)
    }
    this.setData({ messages: [{ id: 'welcome', role: 'guide', text: t('guide.welcome') }] })
  },

  onUnload() {
    if (this.speakingTimer) clearTimeout(this.speakingTimer)
    if (this.listeningTimer) clearTimeout(this.listeningTimer)
  },

  onInput(e) { this.setData({ inputText: e.detail.value }) },

  detectIntent(text) {
    if (/路线|推荐|游览|亲子|深度|休闲/.test(text)) return 'routes'
    if (/门票|票价|多少钱|价格/.test(text)) return 'tickets'
    if (/演出|表演|几点|九龙|吉祥颂/.test(text)) return 'events'
    if (/洗手间|厕所|卫生间|餐饮|吃饭|停车场|服务/.test(text)) return 'services'
    if (/天气/.test(text)) return 'weather'
    return 'chat'
  },

  async onSend() {
    const text = this.data.inputText.trim()
    if (!text || this.data.isLoading) return

    if (this.listeningTimer) clearTimeout(this.listeningTimer)
    if (this.speakingTimer) clearTimeout(this.speakingTimer)

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text }
    const messages = [...this.data.messages, userMsg]
    this.setData({ messages, inputText: '', isListening: true, isLoading: true, scrollToId: `msg-${userMsg.id}` })

    if (this.data.isOffline) {
      this.replyLocal(text)
      return
    }

    const intent = this.detectIntent(text)
    try {
      if (intent === 'routes') await this.handleRouteQuery(text)
      else if (intent === 'tickets') await this.handleTicketQuery()
      else if (intent === 'events') await this.handleEventQuery()
      else if (intent === 'services') await this.handleServiceQuery()
      else if (intent === 'weather') await this.handleWeatherQuery()
      else await this.handleChatQuery(text)
    } catch (e) {
      console.log('[guide] API failed, using local fallback:', e.message)
      this.setData({ isListening: false })
      this.replyLocal(text)
    }
  },

  async handleRouteQuery(text) {
    try {
      const params = /亲子|深度|休闲/.test(text) ? { search: text } : {}
      const data = await api.get('/routes', params)
      const items = data.items || []
      let reply = `灵山胜境当前有 ${items.length} 条推荐路线：\n\n`
      reply += items.map((route, index) => {
        const steps = (route.steps || []).slice(0, 4).map((step) => step.spot).join(' -> ')
        return `${index + 1}. ${route.title}\n${route.duration} | ${route.distance} | ${route.difficulty}\n${steps}`
      }).join('\n\n')
      reply += '\n\n点击“推荐路线”可查看完整路线详情。'
      this.finishReply(reply, '灵山胜境官方资料', 'structured')
    } catch (_) {
      const local = this.matchLocal('推荐路线')
      this.finishReply(local.text, local.source, 'fallback', [], null, true)
    }
  },

  async handleTicketQuery() {
    const local = this.matchLocal('门票')
    this.finishReply(local.text, local.source, 'fallback', [], null, true)
  },

  async handleEventQuery() {
    const local = this.matchLocal('九龙灌浴几点')
    this.finishReply(local.text, local.source, 'fallback', [], null, true)
  },

  async handleServiceQuery() {
    const parking = this.matchLocal('停车场')
    const dining = this.matchLocal('餐饮')
    this.finishReply(`${parking.text}\n\n${dining.text}`, parking.source, 'fallback', [], null, true)
  },

  async handleWeatherQuery() {
    const local = this.matchLocal('天气')
    this.finishReply(local.text, local.source, 'fallback', [], null, true)
  },

  async handleChatQuery(text) {
    const data = await api.post('/chat', { question: text })
    this.finishReply(data.answer, data.source, 'chat', [], data.confidence, false)
  },

  finishReply(text, source, mode, citations, confidence, fallback) {
    const guideMsg = {
      id: `g-${Date.now()}`, role: 'guide', text, source, citations, confidence, fallback, mode,
    }
    const updated = [...this.data.messages, guideMsg]
    this.setData({
      messages: updated,
      isLoading: false,
      isListening: false,
      isSpeaking: true,
      scrollToId: `msg-${guideMsg.id}`,
    })
    this.speakingTimer = setTimeout(() => this.setData({ isSpeaking: false }), Math.min(text.length * 28, 8000))
  },

  replyLocal(text) {
    const matched = this.matchLocal(text)
    this.finishReply(matched.text, matched.source, 'offline', [], null, matched === MOCK_KNOWLEDGE.default)
  },

  matchLocal(text) {
    return MOCK_KNOWLEDGE[text]
      || Object.entries(MOCK_KNOWLEDGE).find(([key]) => text.includes(key.slice(0, 4)))?.[1]
      || MOCK_KNOWLEDGE.default
  },

  onQuickAction(e) {
    const { action, askText } = e.currentTarget.dataset
    const routes = {
      route: '/pages/route/index',
      camera: '/pages/photo/index',
      detail: '/pages/spot-detail/index?id=lingshan-buddha',
      services: '/pages/services/index',
      tickets: '/pages/tickets/index',
    }
    if (routes[action]) { wx.navigateTo({ url: routes[action] }); return }
    if (action === 'ask') this.onSendText(askText)
  },

  onSendText(text) { this.setData({ inputText: text }, () => this.onSend()) },

  toggleOffline() { this.setData({ isOffline: !this.data.isOffline }) },

  toggleLanguage() {
    toggleLang(); this.refreshDisplay(); this.initSession()
  },

  openVoice() { this.setData({ voiceOpen: true, voiceRecording: false }) },
  closeVoice() {
    this.setData({ voiceOpen: false })
    if (this.recorderManager) { try { this.recorderManager.stop() } catch (e) {} }
  },
  startVoiceRecord() {
    this.setData({ voiceRecording: true })
    this.recorderManager.start({
      duration: 10000, sampleRate: 16000, numberOfChannels: 1,
      encodeBitRate: 48000, format: 'mp3',
    })
  },
  stopVoiceRecord() { this.recorderManager.stop() },

  openCamera() { wx.navigateTo({ url: '/pages/photo/index' }) },

  openShare() { wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] }) },
  onShareAppMessage() { return { title: t('share.title'), path: '/pages/guide/index' } },

  onVoiceResult(e) {
    const text = e.currentTarget.dataset.text
    this.setData({ voiceOpen: false }, () => this.onSendText(text))
  },

  onPullDownRefresh() {
    wx.showModal({
      title: t('guide.confirm'), content: t('guide.confirmClear'),
      success: async (res) => {
        if (res.confirm) { session.clear(); this.sessionId = null; await this.initSession() }
        wx.stopPullDownRefresh()
      },
    })
  },
})
