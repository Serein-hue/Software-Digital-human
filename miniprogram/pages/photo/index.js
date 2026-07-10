const { SPOTS } = require('../../utils/data')
const { t } = require('../../utils/i18n')
const api = require('../../utils/api')

Page({
  data: {
    phase: 'idle',
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
      captureLabel: t('photo.capture'), questionPlaceholder: t('photo.questionPlaceholder'),
      promptLabel: t('photo.prompt'), questionLabel: t('photo.questionLabel'), identifyLabel: t('photo.identify'),
      quickSelectLabel: t('photo.quickSelect'), retakeLabel: t('photo.retake'),
      quickSpots: ['灵山大佛', '灵山梵宫', '九龙灌浴', '五印坛城', '祥符禅寺'],
    })
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer)
  },

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

  onQuestionInput(e) {
    this.setData({ question: e.detail.value })
  },

  onQuickSpot(e) {
    const { name } = e.currentTarget.dataset
    this.doRecognize(`给我介绍一下${name}`)
  },

  onSubmitQuestion() {
    const question = this.data.question.trim()
    if (!question) {
      wx.showToast({ title: t('photo.needQuestion'), icon: 'none' })
      return
    }
    this.doRecognize(question)
  },

  async doRecognize(query) {
    this.setData({ phase: 'scanning', progress: 0, results: [] })

    const timer = setInterval(() => {
      const progress = this.data.progress + 3
      if (progress >= 90) { clearInterval(timer); return }
      this.setData({ progress })
    }, 30)

    try {
      const chatData = await api.post('/chat', { question: query })
      clearInterval(timer)
      this.setData({ progress: 100 })

      const answer = chatData.answer || ''
      const results = [{
        id: 'r0',
        name: this.extractName(answer, query),
        category: chatData.source || t('photo.knowledgeCategory'),
        confidence: chatData.confidence === 'high' ? 90 : chatData.confidence === 'medium' ? 70 : 50,
        description: answer.slice(0, 120) || t('photo.answerFallback'),
        spotId: this.guessSpotId(answer),
      }]

      setTimeout(() => {
        this.setData({ phase: 'results', results })
      }, 200)
    } catch (e) {
      clearInterval(timer)
      this.setData({
        phase: 'results',
        progress: 100,
        results: [{
          id: 'r0',
          name: query,
          category: t('photo.offlineCategory'),
          confidence: 80,
          description: t('photo.offlineHint'),
          spotId: null,
        }],
      })
    }
  },

  extractName(text, fallback) {
    const spotNames = Object.values(SPOTS).map((spot) => spot.name)
    for (const name of spotNames) {
      if (text.includes(name)) return name
    }
    return fallback.slice(0, 10) + (fallback.length > 10 ? '...' : '')
  },

  guessSpotId(text) {
    for (const [id, spot] of Object.entries(SPOTS)) {
      if (text.includes(spot.name)) return id
    }
    return null
  },

  retakePhoto() {
    this.setData({ photoPath: '', results: [], question: '', phase: 'idle' })
  },

  startScan() {
    const question = this.data.question.trim()
    if (question) {
      this.doRecognize(question)
    } else {
      this.setData({ phase: 'captured' })
    }
  },

  openDetail(e) {
    const { id } = e.currentTarget.dataset
    if (id) wx.navigateTo({ url: `/pages/spot-detail/index?id=${id}` })
  },

  askAbout(e) {
    const { name } = e.currentTarget.dataset
    const question = `给我详细讲讲${name}`
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
