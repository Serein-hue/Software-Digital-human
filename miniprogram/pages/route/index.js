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
    // 偏好筛选
    prefOptions: [
      { key: 'all', label: '全部', icon: '🗺' },
      { key: '亲子', label: '亲子', icon: '👨‍👩‍👧' },
      { key: '深度', label: '深度', icon: '📖' },
      { key: '休闲', label: '休闲', icon: '🌸' },
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

  /**
   * 加载路线 — API 优先，失败降级
   */
  async loadRoutes(pref) {
    this.setData({ isLoading: true })

    try {
      let data
      if (pref && pref !== 'all') {
        // 按偏好规划
        data = await api.post('/routes/plan', { interests: [pref] })
        const items = data.route ? [data.route] : []
        this.setData({ routes: this.normalizeRoutes(items), routeCount: t('route.count', { n: items.length }), isLoading: false })
        return
      } else {
        data = await api.getCached('/routes', {}, { ttl: 120000 })
        const items = data.items || []
        this.setData({ routes: this.normalizeRoutes(items), routeCount: t('route.count', { n: items.length }), isLoading: false })
        return
      }
    } catch (e) {
      console.log('[route] API 失败，降级本地:', e.message)
    }

    // 降级到本地数据
    this.setData({
      routes: ROUTES,
      routeCount: t('route.count', { n: ROUTES.length }),
      isLoading: false,
    })
  },

  /**
   * 将 API 返回的路线格式转为页面所需格式
   */
  normalizeRoutes(items) {
    return items.map((r) => ({
      id: r.id,
      title: r.name,
      description: r.persona || '',
      duration: r.duration || '约3小时',
      distance: '',
      difficulty: '',
      tags: r.type ? [r.type] : [],
      steps: (r.stops || []).map((s) => ({
        spot: s.spotName || s.spotId,
        duration: s.stayDuration || '',
        note: s.description || '',
      })),
    }))
  },

  /**
   * 偏好筛选
   */
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
