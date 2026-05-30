const { SPOTS, TIERS } = require('../../utils/data')

Page({
  data: {
    spot: null,
    tier: 'shortIntro',
    tiers: TIERS,
    paragraphs: [],
    relatedSpots: [],
    isPlaying: false,
    heroGradient: '',
  },

  onLoad(options) {
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
    const spot = SPOTS[id] || SPOTS['lingshan-buddha']
    const tier = this.data.tier || 'shortIntro'
    const content = spot[tier] || spot.shortIntro
    const paragraphs = content.split('\n').filter(Boolean)
    const relatedSpots = (spot.related || []).map((rid) => SPOTS[rid]).filter(Boolean)

    this.setData({ spot, paragraphs, relatedSpots, heroGradient: spot.heroGradient || '' })
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
    this.loadSpot(id)
    wx.pageScrollTo({ scrollTop: 0, duration: 300 })
  },

  goBack() {
    if (this.audioTimer) clearTimeout(this.audioTimer)
    wx.navigateBack()
  },
})
