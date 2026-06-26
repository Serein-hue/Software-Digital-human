const { SPOTS } = require('../../utils/data')
const { t } = require('../../utils/i18n')
const api = require('../../utils/api')

// 本地 SPOTS key ↔ API spotId 映射（通过景点名称关联）
const SPOT_NAME_MAP = {
  'lingshan-buddha':    { apiId: 'LS-001', name: '灵山大佛' },
  'lingshan-fanpalace': { apiId: 'LS-002', name: '灵山梵宫' },
  'lingshan-jiulong':   { apiId: 'LS-003', name: '九龙灌浴' },
  'lingshan-mandala':   { apiId: 'LS-004', name: '五印坛城' },
  'lingshan-xiangfu':   { apiId: 'LS-005', name: '祥符禅寺' },
  'lingshan-dazhaobi':  { apiId: 'LS-006', name: '阿育王柱' },
  'lingshan-manfeilong':{ apiId: 'LS-010', name: '曼飞龙塔' },
  'lingshan-wuzhimen':  { apiId: 'LS-009', name: '天下第一掌' },
}

Page({
  data: {
    spot: null,
    tier: 'shortIntro',
    tiers: [],
    paragraphs: [],
    relatedSpots: [],
    isPlaying: false,
    heroGradient: '',
    aiNarration: '',
    playingLabel: '',
    nearbySpots: '',
    _localKey: '', // 本地数据 key
    _apiLoaded: false,
  },

  onLoad(options) {
    this.setData({
      aiNarration: t('spot.aiNarration'),
      playingLabel: t('spot.playing'),
      nearbySpots: t('spot.nearbySpots'),
      tiers: [
        { key: 'oneLiner', label: '⏱ ' + t('spot.oneLine') },
        { key: 'shortIntro', label: '⏱ ' + t('spot.shortVersion') },
        { key: 'fullIntro', label: '📖 ' + t('spot.deepGuide') },
      ],
    })
    const id = options.id || 'lingshan-buddha'
    this.loadSpot(id)
  },

  onUnload() {
    if (this.audioTimer) clearTimeout(this.audioTimer)
    if (this.innerAudioContext) {
      this.innerAudioContext.destroy()
    }
  },

  loadSpot(id) {
    // 1. 从本地数据加载（含 rich content）
    const localKey = SPOTS[id] ? id : (SPOT_NAME_MAP[id] ? id : 'lingshan-buddha')
    this.data._localKey = localKey
    const localSpot = SPOTS[localKey]
    if (!localSpot) return

    const tier = this.data.tier || 'shortIntro'
    const content = localSpot[tier] || localSpot.shortIntro
    const paragraphs = content.split('\n').filter(Boolean)
    const relatedSpots = (localSpot.related || []).map((rid) => SPOTS[rid]).filter(Boolean)

    this.setData({ spot: localSpot, paragraphs, relatedSpots, heroGradient: localSpot.heroGradient || '' })

    // 2. 尝试从 API 加载补充数据（若已加载过跳过）
    if (this.data._apiLoaded) return
    const mapping = SPOT_NAME_MAP[localKey]
    if (!mapping) return
    this.data._apiLoaded = true

    api.getSpotDetail(mapping.apiId).then((apiSpot) => {
      if (!apiSpot) return
      // 用 API 的 summary 补充 local 没有的字段
      const merged = { ...this.data.spot }
      if (apiSpot.summary && !merged.oneLiner) merged.oneLiner = apiSpot.summary
      if (apiSpot.tags) merged.tags = apiSpot.tags
      if (apiSpot.location) merged.location = apiSpot.location
      if (apiSpot.highlights) merged.highlights = apiSpot.highlights
      this.setData({ spot: merged })
    }).catch(() => { /* 静默失败，保留本地数据 */ })

    // 3. 尝试从 API 获取讲解词
    api.getSpotGuide(mapping.apiId).then((guide) => {
      if (!guide) return
      // 把讲解词注入 spot 以便展示
    }).catch(() => {})
  },

  setTier(e) {
    const tier = e.currentTarget.dataset.tier
    const spot = this.data.spot
    if (!spot) return
    const content = spot[tier] || spot.shortIntro
    const paragraphs = content.split('\n').filter(Boolean)
    this.setData({ tier, paragraphs })
  },

  togglePlay() {
    const isPlaying = !this.data.isPlaying
    this.setData({ isPlaying })

    if (this.audioTimer) clearTimeout(this.audioTimer)

    if (isPlaying) {
      const dur = (this.data.spot.audioDuration || '2:00').split(':').reduce((m, s) => m * 60 + +s, 0) * 1000
      this.audioTimer = setTimeout(() => this.setData({ isPlaying: false }), dur)
    }
  },

  navigateTo(e) {
    const { id } = e.currentTarget.dataset
    this.data._apiLoaded = false
    this.loadSpot(id)
    wx.pageScrollTo({ scrollTop: 0, duration: 300 })
  },

  goBack() {
    if (this.audioTimer) clearTimeout(this.audioTimer)
    wx.navigateBack()
  },
})
