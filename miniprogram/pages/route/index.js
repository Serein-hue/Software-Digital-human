const { ROUTES } = require('../../utils/data')
const { t } = require('../../utils/i18n')
const api = require('../../utils/api')

// 路线类型 → 标签 & 难度映射
const ROUTE_TYPE_MAP = {
  culture: { tags: ['推荐', '深度', '人文'], difficulty: '中等', distance: '5.2 km' },
  nature:  { tags: ['风光', '休闲', '拍照'], difficulty: '轻松', distance: '4.5 km' },
  family:  { tags: ['亲子', '轻松', '互动'], difficulty: '轻松', distance: '3.0 km' },
}

Page({
  data: {
    routes: [],
    expandedId: null,
    routeTitle: '',
    routeCount: '',
    startNav: '',
  },

  onLoad() {
    this.setData({
      routeTitle: t('route.title'),
      startNav: t('route.startNav'),
    })
    this._loadRoutes()
  },

  // ── 从 API 加载 ──────────────────────────────────────────────────
  _loadRoutes() {
    api.getRoutes().then((items) => {
      if (!items || !items.length) {
        this._useLocalRoutes()
        return
      }
      const routes = items.map((r, idx) => this._mapRoute(r, idx))
      this.setData({ routes, routeCount: t('route.count', { n: routes.length }) })
    }).catch(() => {
      this._useLocalRoutes()
    })
  },

  _useLocalRoutes() {
    this.setData({
      routes: ROUTES,
      routeCount: t('route.count', { n: ROUTES.length }),
    })
  },

  // API 格式 → 页面格式
  _mapRoute(r, idx) {
    const typeInfo = ROUTE_TYPE_MAP[r.type] || { tags: ['推荐'], difficulty: '中等', distance: '—' }
    return {
      id: r.id || `api-${idx}`,
      title: r.name,
      description: r.persona || '探索灵山胜境的独特魅力',
      duration: r.duration,
      distance: typeInfo.distance,
      difficulty: typeInfo.difficulty,
      tags: typeInfo.tags,
      steps: (r.stops || []).map((stop) => ({
        spot: stop.spotName,
        duration: stop.stayDuration,
        note: stop.description || '',
      })),
    }
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
})
