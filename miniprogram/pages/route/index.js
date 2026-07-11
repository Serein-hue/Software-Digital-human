const { ROUTES } = require('../../utils/data')
const { t } = require('../../utils/i18n')
const api = require('../../utils/api')
const { lightFeedback } = require('../../utils/motion')

const ROUTE_TYPE_MAP = {
  culture: { tags: ['推荐', '深度', '人文'], difficulty: '中等', distance: '5.2 km' },
  nature: { tags: ['风光', '休闲', '拍照'], difficulty: '轻松', distance: '4.5 km' },
  family: { tags: ['亲子', '轻松', '互动'], difficulty: '轻松', distance: '3.0 km' },
}

Page({
  data: {
    routes: [], expandedId: null, routeTitle: '', routeCount: '', startNav: '',
    activePref: 'all', prefOptions: [], isLoading: true, emptyLabel: '', refreshLabel: '',
    durationLabel: '', distanceLabel: '', difficultyLabel: '',
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 1, switching: false })
  },

  onLoad() {
    this.setData({
      routeTitle: t('route.title'), routeHeroCopy: t('route.heroCopy'), startNav: t('route.startNav'),
      emptyLabel: t('route.empty'), refreshLabel: t('common.pullRefresh'),
      durationLabel: t('route.durationLabel'), distanceLabel: t('route.distanceLabel'), difficultyLabel: t('route.difficultyLabel'),
      prefOptions: [
        { key: 'all', label: t('route.prefAll'), glyph: '全' },
        { key: 'culture', label: t('route.prefCulture'), glyph: '文' },
        { key: 'nature', label: t('route.prefNature'), glyph: '景' },
        { key: 'family', label: t('route.prefFamily'), glyph: '亲' },
      ],
    })
    this._loadRoutes()
  },

  _loadRoutes() {
    this.setData({ isLoading: true })
    api.getRoutes().then((items) => {
      const routes = items && items.length ? items.map((r, idx) => this._mapRoute(r, idx)) : this._localRoutes()
      this._applyRoutes(routes)
    }).catch(() => this._applyRoutes(this._localRoutes()))
  },

  _localRoutes() {
    return ROUTES.map((route) => ({ ...route, type: route.id === 'history' ? 'culture' : route.id }))
  },

  _applyRoutes(routes) {
    this._allRoutes = routes
    this.setData({ isLoading: false })
    this._filterRoutes(this.data.activePref)
  },

  _filterRoutes(pref) {
    const all = this._allRoutes || []
    const routes = pref === 'all' ? all : all.filter((route) => route.type === pref)
    this.setData({ routes, routeCount: t('route.count', { n: routes.length }) })
  },

  _mapRoute(r, idx) {
    const typeInfo = ROUTE_TYPE_MAP[r.type] || { tags: ['推荐'], difficulty: '中等', distance: '—' }
    return {
      id: r.id || `api-${idx}`, type: r.type || 'culture', title: r.name,
      description: r.persona || t('route.defaultDesc'), duration: r.duration,
      distance: typeInfo.distance, difficulty: typeInfo.difficulty, tags: typeInfo.tags,
      steps: (r.stops || []).map((stop) => ({ spot: stop.spotName, duration: stop.stayDuration, note: stop.description || '' })),
    }
  },

  onPrefTap(e) {
    lightFeedback()
    const pref = e.currentTarget.dataset.pref
    this.setData({ activePref: pref, expandedId: null })
    this._filterRoutes(pref)
  },

  toggleExpand(e) {
    lightFeedback()
    const { id } = e.currentTarget.dataset
    this.setData({ expandedId: this.data.expandedId === id ? null : id })
  },

  onPullDownRefresh() { this._loadRoutes(); wx.stopPullDownRefresh() },
  goBack() { wx.navigateBack() },
})
