const { SPOTS } = require('../../utils/data')
const { t } = require('../../utils/i18n')
const api = require('../../utils/api')

Page({
  data: {
    spot: null,
    tier: 'shortIntro',
    tiers: [],
    paragraphs: [],
    relatedSpots: [],
    isPlaying: false,
    isLoading: true,
    heroGradient: '',
    aiNarration: '',
    playingLabel: '',
    nearbySpots: '',
    loadError: false,
  },

  onLoad(options) {
    this.setData({
      aiNarration: t('spot.aiNarration'),
      playingLabel: t('spot.playing'),
      nearbySpots: t('spot.nearbySpots'),
      tiers: [
        { key: 'oneLiner', label: '概览' },
        { key: 'shortIntro', label: t('spot.shortVersion') },
        { key: 'fullIntro', label: t('spot.deepGuide') },
      ],
    })
    this.loadSpot(options.id || 'lingshan-buddha')
  },

  onUnload() {
    if (this.audioTimer) clearTimeout(this.audioTimer)
    if (this.innerAudioContext) this.innerAudioContext.destroy()
  },

  async loadSpot(id) {
    this.setData({ isLoading: true, loadError: false })

    try {
      const [spotData, relatedData] = await Promise.all([
        api.getCached(`/spots/${id}`, {}, { ttl: 120000 }),
        api.getCached(`/spots/${id}/related`, {}, { ttl: 120000 }).catch(() => []),
      ])
      const spot = this.normalizeSpot(spotData)
      const relatedSpots = (relatedData || []).map((item) => this.normalizeSpot(item))
      this.renderSpot(spot, relatedSpots)
      return
    } catch (e) {
      console.log('[spot-detail] API failed, using local fallback:', e.message)
    }

    this.loadSpotLocal(id)
  },

  normalizeSpot(spot) {
    return {
      id: spot.id,
      name: spot.name,
      category: spot.category || '',
      heroGradient: spot.heroGradient || this.pickGradient(spot.id),
      oneLiner: spot.oneLiner || spot.params || spot.shortIntro || '',
      shortIntro: spot.shortIntro || '',
      fullIntro: spot.fullIntro || spot.shortIntro || '',
      source: spot.source || '',
      audioDuration: spot.audioDuration || '3:00',
      related: spot.related || [],
    }
  },

  pickGradient(id) {
    const map = {
      'lingshan-buddha': 'linear-gradient(160deg, #1a3a2a 0%, #2a5a3a 30%, #5a8a4a 70%, #3a6a2a 100%)',
      'lingshan-fanpalace': 'linear-gradient(160deg, #3a2a1a 0%, #5a3a2a 30%, #8a5a3a 70%, #5a3a1a 100%)',
      'lingshan-jiulong': 'linear-gradient(160deg, #1a3a5a 0%, #2a4a6a 30%, #3a6a8a 70%, #1a4a6a 100%)',
      'lingshan-mandala': 'linear-gradient(160deg, #3a1a2a 0%, #5a1a3a 30%, #8a2a4a 70%, #5a1a3a 100%)',
      'lingshan-xiangfu': 'linear-gradient(160deg, #2a3a1a 0%, #3a4a2a 30%, #4a5a3a 70%, #2a3a1a 100%)',
    }
    return map[id] || 'linear-gradient(160deg, #1a3a2a 0%, #2a5a3a 30%, #5a8a4a 70%, #3a6a2a 100%)'
  },

  loadSpotLocal(id) {
    const spot = SPOTS[id] || SPOTS['lingshan-buddha']
    if (!spot) {
      this.setData({ isLoading: false, loadError: true })
      return
    }
    const relatedSpots = (spot.related || []).map((rid) => SPOTS[rid]).filter(Boolean)
    this.renderSpot(spot, relatedSpots)
  },

  renderSpot(spot, relatedSpots) {
    const tier = this.data.tier || 'shortIntro'
    const content = spot[tier] || spot.shortIntro || ''
    const paragraphs = content.split('\n').filter(Boolean)

    this.setData({
      spot,
      paragraphs,
      relatedSpots: relatedSpots || [],
      heroGradient: spot.heroGradient || '',
      isLoading: false,
    })
  },

  setTier(e) {
    const tier = e.currentTarget.dataset.tier
    const spot = this.data.spot
    if (!spot) return
    const content = spot[tier] || spot.shortIntro || ''
    this.setData({ tier, paragraphs: content.split('\n').filter(Boolean) })
  },

  togglePlay() {
    const isPlaying = !this.data.isPlaying
    this.setData({ isPlaying })

    if (this.audioTimer) clearTimeout(this.audioTimer)
    if (isPlaying) {
      const duration = (this.data.spot.audioDuration || '2:00')
        .split(':')
        .reduce((minutes, seconds) => minutes * 60 + Number(seconds), 0) * 1000
      this.audioTimer = setTimeout(() => this.setData({ isPlaying: false }), duration)
    }
  },

  navigateTo(e) {
    const { id } = e.currentTarget.dataset
    if (id) this.loadSpot(id)
    wx.pageScrollTo({ scrollTop: 0, duration: 300 })
  },

  goBack() {
    if (this.audioTimer) clearTimeout(this.audioTimer)
    wx.navigateBack()
  },

  onPullDownRefresh() {
    const id = this.data.spot ? this.data.spot.id : 'lingshan-buddha'
    this.loadSpot(id)
    wx.stopPullDownRefresh()
  },
})
