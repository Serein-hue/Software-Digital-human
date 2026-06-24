const { SPOTS } = require('../../utils/data')
const { t } = require('../../utils/i18n')
const api = require('../../utils/api')

Page({
  data: {
    phase: 'idle',         // idle | captured | scanning | results
    progress: 0,
    results: [],
    photoPath: '',
    question: '',
    pageTitle: '', pageHint: '', scanningLabel: '', scanningHint: '',
    resultsLabel: '', rescanLabel: '', confidenceLabel: '',
    askLabel: '', captureLabel: '', questionPlaceholder: '',
  },

  onLoad() {
    this.setData({
      phase: 'idle',
      pageTitle: t('photo.results'), pageHint: t('photo.hint'),
      scanningLabel: t('photo.scanning'), scanningHint: t('photo.hint'),
      resultsLabel: t('photo.results'), rescanLabel: t('photo.rescan'),
      confidenceLabel: t('photo.confidence'), askLabel: t('photo.ask'),
      captureLabel: t('photo.capture'), questionPlaceholder: '这是哪个景点？输入你想了解的...',
    })
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer)
  },

  /**
   * 拍照 — 调用真实相机
   */
  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const photoPath = res.tempFiles[0].tempFilePath
        this.setData({ photoPath, phase: 'captured', results: [] })
      },
      fail: () => {
        wx.showToast({ title: t('photo.failToast'), icon: 'none' })
      },
    })
  },

  /**
   * 输入问题 → 调 RAG 识别
   */
  onQuestionInput(e) {
    this.setData({ question: e.detail.value })
  },

  /**
   * 快速提问 — 从景点列表选
   */
  onQuickSpot(e) {
    const { name } = e.currentTarget.dataset
    this.doRecognize(`给我介绍一下${name}`)
  },

  /**
   * 提交自定义问题
   */
  onSubmitQuestion() {
    const q = this.data.question.trim()
    if (!q) {
      wx.showToast({ title: '请输入你想了解的内容', icon: 'none' })
      return
    }
    this.doRecognize(q)
  },

  /**
   * 核心：发问题 → RAG → 展示结果
   */
  async doRecognize(query) {
    this.setData({ phase: 'scanning', progress: 0, results: [] })

    // 模拟进度动画
    const timer = setInterval(() => {
      const p = this.data.progress + 3
      if (p >= 90) { clearInterval(timer); return }
      this.setData({ progress: p })
    }, 30)

    try {
      const ragData = await api.post('/rag/query', { query, top_k: 4 })

      clearInterval(timer)
      this.setData({ progress: 100 })

      // 构建结果列表
      let results = []
      if (ragData.answerable && ragData.contexts) {
        results = ragData.contexts.map((c, i) => ({
          id: `r${i}`,
          name: this.extractName(c.text, query),
          category: c.source_name || '知识库',
          confidence: Math.round(c.score * 100),
          description: c.text.slice(0, 120),
          spotId: this.guessSpotId(c.text),
        }))
      }

      // RAG 无结果时用本地降级
      if (results.length === 0) {
        results = [{
          id: 'r0',
          name: query,
          category: 'AI 理解',
          confidence: 85,
          description: '已理解您的问题，点"提问"让我为您详细解答 →',
          spotId: null,
        }]
      }

      setTimeout(() => {
        this.setData({ phase: 'results', results })
      }, 200)
    } catch (e) {
      clearInterval(timer)
      // 降级：直接提示用户去问 AI
      this.setData({
        phase: 'results',
        progress: 100,
        results: [{
          id: 'r0',
          name: query,
          category: '离线模式',
          confidence: 80,
          description: '网络不可用，点击"提问"使用离线知识库解答 →',
          spotId: null,
        }],
      })
    }
  },

  /**
   * 从文本中提取可能的景点名
   */
  extractName(text, fallback) {
    const spotNames = Object.values(SPOTS).map(s => s.name)
    for (const name of spotNames) {
      if (text.includes(name)) return name
    }
    // 返回前10个字作为标题
    return fallback.slice(0, 10) + (fallback.length > 10 ? '...' : '')
  },

  /**
   * 猜测 spotId
   */
  guessSpotId(text) {
    for (const [id, spot] of Object.entries(SPOTS)) {
      if (text.includes(spot.name)) return id
    }
    return null
  },

  /**
   * 重新拍摄
   */
  retakePhoto() {
    this.setData({ photoPath: '', results: [], question: '', phase: 'idle' })
  },

  /**
   * 重新扫描
   */
  startScan() {
    const q = this.data.question.trim()
    if (q) {
      this.doRecognize(q)
    } else {
      this.setData({ phase: 'captured' })
    }
  },

  /**
   * 打开景点详情
   */
  openDetail(e) {
    const { id } = e.currentTarget.dataset
    if (id) wx.navigateTo({ url: `/pages/spot-detail/index?id=${id}` })
  },

  /**
   * 带着问题去问 AI
   */
  askAbout(e) {
    const { name } = e.currentTarget.dataset
    const result = this.data.results.find(r => r.name === name)
    const question = result ? `给我详细讲讲${name}` : name
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    if (prevPage && prevPage.onSendText) {
      prevPage.onSendText(question)
    }
    wx.navigateBack()
  },

  goBack() {
    if (this._timer) clearInterval(this._timer)
    wx.navigateBack()
  },
})
