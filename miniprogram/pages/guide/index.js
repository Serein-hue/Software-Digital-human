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
    onlineServices: '',
    onlineTickets: '',
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
      toggleOfflineAria: t('guide.toggleOffline'),
      shareAria: t('guide.share'),
      onlineServices: t('quick.services'),
      onlineTickets: t('quick.tickets'),
      quickActions: QUICK_ACTIONS.map((q) => ({
        ...q,
        label: t(q.i18nKey),
      })),
    })
  },

  async onLoad() {
    this.refreshDisplay()

    // 初始化录音管理器
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

    // 尝试恢复会话和历史消息
    await this.initSession()
  },

  /**
   * 初始化会话：创建或恢复，加载历史消息
   */
  async initSession() {
    try {
      const sessionId = await session.ensure({ source: 'miniprogram' })
      this.sessionId = sessionId

      // 尝试加载历史消息
      try {
        const data = await api.get(`/sessions/${sessionId}/messages`, { limit: 50 })
        if (data.messages && data.messages.length > 0) {
          const messages = data.messages.map((m) => ({
            id: m.id,
            role: m.role === 'assistant' ? 'guide' : m.role,
            text: m.text,
            source: m.citations && m.citations.length > 0 ? m.citations[0].source_name : null,
            citations: m.citations || [],
            confidence: m.confidence,
            fallback: m.fallback,
          }))
          // 确保以欢迎消息开头
          if (messages[0].role !== 'guide') {
            messages.unshift({
              id: 'welcome',
              role: 'guide',
              text: t('guide.welcome'),
            })
          }
          this.setData({ messages })
          return
        }
      } catch (e) {
        console.log('[guide] 加载历史消息失败，显示欢迎语:', e.message)
      }
    } catch (e) {
      console.log('[guide] 会话初始化失败，使用离线模式:', e.message)
      this.setData({ isOffline: true })
    }

    // 无历史消息 / 网络错误：显示欢迎语
    this.setData({
      messages: [{
        id: 'welcome',
        role: 'guide',
        text: t('guide.welcome'),
      }],
    })
  },

  onUnload() {
    if (this.speakingTimer) clearTimeout(this.speakingTimer)
    if (this.listeningTimer) clearTimeout(this.listeningTimer)
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },

  /**
   * 发送消息 — 核心流程:
   *   1. 显示用户消息
   *   2. 离线 → 本地 MOCK_KNOWLEDGE 匹配
   *   3. 在线 → POST /rag/query → 渲染结果 → 存消息历史
   */
  async onSend() {
    const text = this.data.inputText.trim()
    if (!text || this.data.isLoading) return

    if (this.listeningTimer) clearTimeout(this.listeningTimer)
    if (this.speakingTimer) clearTimeout(this.speakingTimer)

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text }
    const messages = [...this.data.messages, userMsg]
    this.setData({ messages, inputText: '', isListening: true, isLoading: true, scrollToId: `msg-${userMsg.id}` })

    // ── 离线模式：本地匹配 ──
    if (this.data.isOffline) {
      this.replyLocal(text)
      return
    }

    // ── 在线模式：RAG 查询 ──
    try {
      // 1. 存用户消息（非阻塞，允许失败）
      if (this.sessionId) {
        api.post(`/sessions/${this.sessionId}/messages`, { role: 'user', text }).catch(() => {})
      }

      // 2. 调用 RAG
      const ragData = await api.post('/rag/query', { query: text, top_k: 3 })

      this.setData({ isListening: false, isSpeaking: true })

      let replyText = ''
      let source = ''
      let citations = []
      let fallback = false
      let confidence = null

      if (ragData.answerable && ragData.contexts && ragData.contexts.length > 0) {
        // RAG 有结果 — 拼接上下文作为回答
        replyText = ragData.contexts[0].text
        if (ragData.contexts.length > 1 && ragData.contexts[1].score > 0.6) {
          replyText += '\n\n' + ragData.contexts[1].text
        }
        source = ragData.contexts[0].source_name || ''
        citations = ragData.citations || []
        confidence = ragData.contexts[0].score
      } else if (ragData.safe_reply) {
        // RAG 提供兜底回复
        replyText = ragData.safe_reply
        fallback = true
      } else if (ragData.fallback && ragData.fallback.safe_reply) {
        replyText = ragData.fallback.safe_reply
        fallback = true
      } else {
        // RAG 也无结果，本地兜底
        const localMatch = this.matchLocal(text)
        replyText = localMatch.text
        source = localMatch.source
        fallback = true
      }

      // 加免责声明
      if (ragData.disclaimer && !replyText.includes('以上信息来源于')) {
        replyText += '\n\n⚠️ ' + ragData.disclaimer
      }

      const guideMsg = {
        id: `g-${Date.now()}`,
        role: 'guide',
        text: replyText,
        source,
        citations,
        confidence,
        fallback,
      }
      const updated = [...this.data.messages, guideMsg]
      this.setData({ messages: updated, isLoading: false, scrollToId: `msg-${guideMsg.id}` })

      // 3. 存 AI 回复
      if (this.sessionId) {
        api.post(`/sessions/${this.sessionId}/messages`, {
          role: 'assistant',
          text: replyText,
          citations,
          fallback,
          fallbackReason: fallback ? 'low_confidence' : null,
          confidence,
        }).catch(() => {})
      }

      // 说话动画延时
      this.speakingTimer = setTimeout(() => this.setData({ isSpeaking: false }), Math.min(replyText.length * 30, 8000))
    } catch (e) {
      // API 失败 → 降级到本地
      console.log('[guide] API 调用失败，降级到本地匹配:', e.message)
      this.setData({ isListening: false })
      this.replyLocal(text)
    }
  },

  /**
   * 本地关键词匹配（离线/API降级兜底）
   */
  replyLocal(text) {
    const matched = MOCK_KNOWLEDGE[text]
      || Object.entries(MOCK_KNOWLEDGE).find(([key]) => text.includes(key.slice(0, 4)))?.[1]
      || MOCK_KNOWLEDGE.default

    this.setData({ isSpeaking: true })

    const guideMsg = {
      id: `g-${Date.now()}`,
      role: 'guide',
      text: matched.text,
      source: matched.source,
      fallback: matched === MOCK_KNOWLEDGE.default,
    }
    const updated = [...this.data.messages, guideMsg]
    this.setData({ messages: updated, isLoading: false, scrollToId: `msg-${guideMsg.id}` })

    // 模拟说话延时
    this.speakingTimer = setTimeout(() => this.setData({ isSpeaking: false }), Math.min(matched.text.length * 35, 8000))
  },

  /**
   * 本地匹配辅助函数
   */
  matchLocal(text) {
    return MOCK_KNOWLEDGE[text]
      || Object.entries(MOCK_KNOWLEDGE).find(([key]) => text.includes(key.slice(0, 4)))?.[1]
      || MOCK_KNOWLEDGE.default
  },

  onQuickAction(e) {
    const { action, askText } = e.currentTarget.dataset
    if (action === 'route') {
      wx.navigateTo({ url: '/pages/route/index' })
    } else if (action === 'camera') {
      wx.navigateTo({ url: '/pages/photo/index' })
    } else if (action === 'detail') {
      wx.navigateTo({ url: '/pages/spot-detail/index?id=lingshan-buddha' })
    } else if (action === 'services') {
      wx.navigateTo({ url: '/pages/services/index' })
    } else if (action === 'tickets') {
      wx.navigateTo({ url: '/pages/tickets/index' })
    } else if (action === 'ask') {
      this.onSendText(askText)
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
    // 重新初始化
    this.initSession()
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
      success: async (res) => {
        if (res.confirm) {
          session.clear()
          this.sessionId = null
          await this.initSession()
        }
        wx.stopPullDownRefresh()
      },
    })
  },
})
