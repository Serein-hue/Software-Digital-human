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

    // LBS 到达自动触发：如果从景点详情页跳转过来带 spotId
    if (options && options.spotId) {
      setTimeout(() => {
        this.onSendText(`给我讲讲${options.spotName || '这个景点'}`)
      }, 500)
    }
  },

  async initSession() {
    try {
      const sessionId = await session.ensure({ source: 'miniprogram' })
      this.sessionId = sessionId
      try {
        const data = await api.get(`/sessions/${sessionId}/messages`, { limit: 50 })
        if (data.messages && data.messages.length > 0) {
          const messages = data.messages.map((m) => ({
            id: m.id,
            role: m.role === 'assistant' ? 'guide' : m.role,
            text: m.text, source: m.citations?.[0]?.source_name || null,
            citations: m.citations || [], confidence: m.confidence, fallback: m.fallback,
          }))
          if (messages[0].role !== 'guide') {
            messages.unshift({ id: 'welcome', role: 'guide', text: t('guide.welcome') })
          }
          this.setData({ messages })
          return
        }
      } catch (e) { console.log('[guide] 历史加载失败:', e.message) }
    } catch (e) {
      console.log('[guide] 会话初始化失败，离线:', e.message)
      this.setData({ isOffline: true })
    }
    this.setData({ messages: [{ id: 'welcome', role: 'guide', text: t('guide.welcome') }] })
  },

  onUnload() {
    if (this.speakingTimer) clearTimeout(this.speakingTimer)
    if (this.listeningTimer) clearTimeout(this.listeningTimer)
  },

  onInput(e) { this.setData({ inputText: e.detail.value }) },

  /**
   * 意图检测：匹配到结构化查询时直接用 API，否则走 RAG
   */
  detectIntent(text) {
    const patterns = [
      { regex: /路线|推荐.*(路|游|逛)|怎么(逛|玩|游)|游览.*(顺序|路线)/, handler: 'routes' },
      { regex: /门票|票价|多少钱|价格/, handler: 'tickets' },
      { regex: /演出|表演|几点.*(演|表|开)|吉祥颂|九龙.*(表演|几点)/, handler: 'events' },
      { regex: /洗手间|厕所|卫生间|餐饮|吃饭|停车场(在|有|位)|哪有.*(厕所|洗手间|卫生间|餐厅|饭)/, handler: 'services' },
      { regex: /天气/, handler: 'weather' },
    ]
    for (const p of patterns) {
      if (p.regex.test(text)) return p.handler
    }
    return 'rag'
  },

  async onSend() {
    const text = this.data.inputText.trim()
    if (!text || this.data.isLoading) return

    if (this.listeningTimer) clearTimeout(this.listeningTimer)
    if (this.speakingTimer) clearTimeout(this.speakingTimer)

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text }
    const messages = [...this.data.messages, userMsg]
    this.setData({ messages, inputText: '', isListening: true, isLoading: true, scrollToId: `msg-${userMsg.id}` })

    if (this.data.isOffline) { this.replyLocal(text); return }

    // 确保 session 已就绪（防止 race condition）
    if (!this.sessionId) {
      try { this.sessionId = await session.ensure({ source: 'miniprogram' }) } catch (_) {}
    }

    // 存用户消息
    if (this.sessionId) {
      api.post(`/sessions/${this.sessionId}/messages`, { role: 'user', text }).catch(() => {})
    }

    const intent = this.detectIntent(text)
    try {
      if (intent === 'routes') await this.handleRouteQuery(text)
      else if (intent === 'tickets') await this.handleTicketQuery()
      else if (intent === 'events') await this.handleEventQuery()
      else if (intent === 'services') await this.handleServiceQuery()
      else if (intent === 'weather') await this.handleWeatherQuery()
      else await this.handleRagQuery(text)
    } catch (e) {
      console.log('[guide] API 失败，降级本地:', e.message)
      this.setData({ isListening: false })
      this.replyLocal(text)
    }
  },

  // ─── 结构化查询处理器 ───

  async handleRouteQuery(text) {
    let reply = ''
    try {
      // 尝试智能推荐
      let interest = ''
      if (/亲子|孩子|小朋友/.test(text)) interest = '亲子'
      else if (/深度|详细|文化|历史/.test(text)) interest = '深度'
      else if (/休闲|轻松|拍照|自然/.test(text)) interest = '休闲'

      if (interest) {
        const data = await api.post('/routes/plan', { interests: [interest], duration: '4' })
        if (data.route) {
          const r = data.route
          reply = `为您推荐「${r.name}」\n⏱ ${r.duration} | 👤 ${r.persona || ''}\n\n`
          if (r.stops) {
            reply += r.stops.map((s, i) => `${i + 1}. ${s.spotName}（${s.stayDuration}）`).join('\n')
          }
          if (r.tips) reply += `\n\n💡 ${r.tips}`
        }
      }
      if (!reply) {
        const data = await api.get('/routes')
        const items = data.items || []
        reply = `灵山胜境有 ${items.length} 条精选路线：\n\n`
        reply += items.map((r, i) => `${i + 1}. **${r.name}** — ${r.persona || ''}（${r.duration}）`).join('\n')
        reply += '\n\n点击下方「推荐路线」查看详情 👇'
      }
    } catch (_) {
      reply = this.matchLocal('推荐路线').text
    }
    this.finishReply(reply, '灵山胜境官方资料', 'structured')
  },

  async handleTicketQuery() {
    let reply = ''
    try {
      const data = await api.get('/tickets/products')
      const items = data.items || []
      reply = '灵山胜境票务信息：\n\n'
      items.forEach((t) => {
        const status = t.status === 'available' ? '在售' : '停售'
        reply += `🎫 ${t.name}\n    💰 ¥${t.price}/人  [${status}]\n\n`
      })
      reply += '成人票210元，学生票105元（凭证件），60-69岁老人105元，70岁以上免票。\n票价包含所有核心景点及《灵山吉祥颂》演出。\n\n⚠️ 此为信息查询，购票请通过官方小程序。'
    } catch (_) {
      reply = this.matchLocal('门票').text
    }
    this.finishReply(reply, '灵山胜境官方资料', 'structured')
  },

  async handleEventQuery() {
    let reply = ''
    try {
      const data = await api.get('/events')
      const items = data.items || []
      reply = '今日演出活动：\n\n'
      items.forEach((ev) => {
        reply += `🎪 ${ev.name}\n🕐 ${ev.time}\n📝 ${ev.description || ''}\n\n`
      })
      reply += '建议提前10-15分钟到场占位。'
    } catch (_) {
      reply = this.matchLocal('九龙灌浴几点').text
    }
    this.finishReply(reply, '灵山胜境官方资料', 'structured')
  },

  async handleServiceQuery() {
    let reply = ''
    try {
      const data = await api.get('/services')
      const items = data.items || []
      const cats = { toilet: '🚻 洗手间', restaurant: '🍽 餐饮', parking: '🅿 停车场', help_point: '🆘 求助点' }
      const grouped = {}
      items.forEach((s) => {
        if (!grouped[s.category]) grouped[s.category] = []
        grouped[s.category].push(s)
      })
      reply = '景区服务设施：\n\n'
      Object.entries(grouped).forEach(([cat, svcs]) => {
        reply += `${cats[cat] || cat}：\n`
        svcs.forEach((s) => { reply += `  📍 ${s.name} — ${s.location}\n` })
        reply += '\n'
      })
    } catch (_) {
      reply = '景区内洗手间分布在各大景点：灵山大佛广场、梵宫一层、五印坛城入口、祥符禅寺旁、九龙灌浴广场。餐饮有灵山精舍素斋馆（人均68元）、梵宫自助餐厅（人均88元）、出口素面馆（人均25元）。停车场P1南门最大，总车位约5000个，小车10元/次。'
    }
    this.finishReply(reply, '灵山胜境官方资料', 'structured')
  },

  async handleWeatherQuery() {
    let reply = ''
    try {
      const data = await api.get('/weather')
      reply = `今日灵山天气：${data.weather}，气温约${data.temperature}°C。`
      if (data.warning) reply += `\n⚠️ ${data.warning}`
      reply += '\n建议春秋季备薄外套，夏季备雨具和防晒。秋季（9-11月）是最佳旅游季节。'
    } catch (_) {
      reply = '灵山胜境地处太湖北岸，四季分明。建议春秋季备薄外套，夏季备雨具和防晒。秋季（9-11月）天高气爽，银杏金黄，是最佳旅游季节。'
    }
    this.finishReply(reply, '灵山胜境官方资料', 'structured')
  },

  // ─── RAG 查询 ───

  async handleRagQuery(text) {
    const ragData = await api.post('/rag/query', { query: text, top_k: 5 })
    this.setData({ isListening: false, isSpeaking: true })

    let replyText = '', source = '', citations = [], confidence = null
    let fallback = false

    if (ragData.answerable && ragData.contexts && ragData.contexts.length > 0) {
      // 取最高分 + 拼接高分上下文
      const best = ragData.contexts[0]
      replyText = this.cleanChunk(best.text)
      // 拼接第二高分的不同内容
      if (ragData.contexts.length > 1 && ragData.contexts[1].score > 0.55 &&
          !ragData.contexts[1].text.includes(replyText.slice(0, 30))) {
        replyText += '\n\n' + this.cleanChunk(ragData.contexts[1].text)
      }
      source = best.source_name || ''
      citations = ragData.citations || []
      confidence = best.score
    } else if (ragData.safe_reply || (ragData.fallback && ragData.fallback.safe_reply)) {
      replyText = ragData.safe_reply || ragData.fallback.safe_reply
      fallback = true
    } else {
      const lm = this.matchLocal(text)
      replyText = lm.text; source = lm.source; fallback = true
    }

    if (ragData.disclaimer && !replyText.includes('以上信息来源于')) {
      replyText += '\n\n⚠️ ' + ragData.disclaimer
    }

    this.finishReply(replyText, source, fallback ? 'fallback' : 'rag', citations, confidence, fallback)
  },

  /**
   * 清洗 RAG chunk：去掉 markdown 标题标记、多余空白、表格残留
   */
  cleanChunk(text) {
    return text
      .replace(/^#+\s+/gm, '')           // 去掉 markdown 标题
      .replace(/\|/g, '')                 // 去掉表格竖线
      .replace(/-{3,}/g, '')              // 去掉分隔线
      .replace(/\n{3,}/g, '\n\n')         // 压缩多余空行
      .replace(/^\s*>\s*/gm, '')          // 去掉引用标记
      .trim()
  },

  // ─── 通用回复完成 ───

  finishReply(text, source, mode, citations, confidence, fallback) {
    const guideMsg = {
      id: `g-${Date.now()}`, role: 'guide', text, source, citations, confidence, fallback, mode,
    }
    const updated = [...this.data.messages, guideMsg]
    this.setData({ messages: updated, isLoading: false, scrollToId: `msg-${guideMsg.id}` })

    if (this.sessionId) {
      api.post(`/sessions/${this.sessionId}/messages`, {
        role: 'assistant', text, citations,
        fallback: !!fallback, confidence,
      }).catch(() => {})
    }
    this.speakingTimer = setTimeout(() => this.setData({ isSpeaking: false }), Math.min(text.length * 28, 8000))
  },

  replyLocal(text) {
    const matched = this.matchLocal(text)
    this.setData({ isSpeaking: true })
    this.finishReply(matched.text, matched.source, 'offline', [], null, matched === MOCK_KNOWLEDGE.default)
  },

  matchLocal(text) {
    return MOCK_KNOWLEDGE[text]
      || Object.entries(MOCK_KNOWLEDGE).find(([key]) => text.includes(key.slice(0, 4)))?.[1]
      || MOCK_KNOWLEDGE.default
  },

  // ─── UI 交互 ───

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
