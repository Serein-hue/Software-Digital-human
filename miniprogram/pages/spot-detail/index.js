const { SPOTS, TIERS } = require('../../utils/data')

Page({
  data: {
    spot: null,
    tier: 'shortIntro',
    tiers: TIERS,
    paragraphs: [],
    relatedSpots: [],
    isPlaying: false,
  },

  onLoad(options) {
    const id = options.id || 'lingshan-buddha'
    this.loadSpot(id)
  },

  loadSpot(id) {
    const spot = SPOTS[id] || SPOTS['lingshan-buddha']
    const paragraphs = (spot.shortIntro || '').split('\n').filter(Boolean)
    const relatedSpots = (spot.related || []).map((rid) => SPOTS[rid]).filter(Boolean)

    this.setData({ spot, paragraphs, relatedSpots })
  },

  setTier(e) {
    const tier = e.currentTarget.dataset.tier
    const spot = this.data.spot
    const content = spot[tier] || spot.shortIntro
    const paragraphs = content.split('\n').filter(Boolean)
    this.setData({ tier, paragraphs })
  },

  togglePlay() {
    const isPlaying = !this.data.isPlaying
    this.setData({ isPlaying })
    if (isPlaying) {
      const dur = this.data.spot.audioDuration.split(':').reduce((m, s) => m * 60 + +s, 0) * 1000
      setTimeout(() => this.setData({ isPlaying: false }), dur)
    }
  },

  navigateTo(e) {
    const { id } = e.currentTarget.dataset
    this.loadSpot(id)
    wx.pageScrollTo({ scrollTop: 0 })
  },

  goBack() {
    wx.navigateBack()
  },
})
