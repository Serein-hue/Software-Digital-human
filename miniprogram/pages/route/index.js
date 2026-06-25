const { ROUTES } = require('../../utils/data')
const { t } = require('../../utils/i18n')
const api = require('../../utils/api')

Page({
  data: {
    routes: [],
    expandedId: null,
    isLoading: true,
    routeTitle: '',
    routeCount: '',
    startNav: '',
    prefOptions: [
      { key: 'all', label: '全部', icon: '路线' },
      { key: '亲子', label: '亲子', icon: '家庭' },
      { key: '深度', label: '深度', icon: '文化' },
      { key: '休闲', label: '休闲', icon: '风景' },
    ],
    activePref: 'all',
  },

  onLoad() {
    this.setData({
      routeTitle: t('route.title'),
      startNav: t('route.startNav'),
    })
    this.loadRoutes()
  },

  async loadRoutes(pref) {
    this.setData({ isLoading: true })

    try {
      const params = pref && pref !== 'all' ? { search: pref } : {}
      const data = await api.getCached('/routes', params, { ttl: 120000 })
      const items = data.items || []
      this.setData({
        routes: this.normalizeRoutes(items),
        routeCount: t('route.count', { n: items.length }),
        isLoading: false,
      })
      return
    } catch (e) {
      console.log('[route] API failed, using local fallback:', e.message)
    }

    const fallback = pref && pref !== 'all'
      ? ROUTES.filter((route) => JSON.stringify(route).includes(pref))
      : ROUTES
    this.setData({
      routes: fallback,
      routeCount: t('route.count', { n: fallback.length }),
      isLoading: false,
    })
  },

  normalizeRoutes(items) {
    return items.map((route) => ({
      id: route.id,
      title: route.title || route.name || '',
      description: route.description || route.persona || '',
      duration: route.duration || '',
      distance: route.distance || '',
      difficulty: route.difficulty || '',
      tags: route.tags || (route.type ? [route.type] : []),
      steps: (route.steps || route.stops || []).map((step) => ({
        spot: step.spot || step.spotName || step.spotId || '',
        duration: step.duration || step.stayDuration || '',
        note: step.note || step.description || '',
      })),
    }))
  },

  onPrefTap(e) {
    const pref = e.currentTarget.dataset.pref
    if (pref === this.data.activePref) return
    this.setData({ activePref: pref })
    this.loadRoutes(pref)
  },

  toggleExpand(e) {
    const { id } = e.currentTarget.dataset
    this.setData({
      expandedId: this.data.expandedId === id ? null : id,
    })
  },

  goBack() {
    wx.navigateBack()
  },

  onPullDownRefresh() {
    this.loadRoutes(this.data.activePref)
    wx.stopPullDownRefresh()
  },
})
