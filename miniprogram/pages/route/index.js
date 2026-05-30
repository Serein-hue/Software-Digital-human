const { ROUTES } = require('../../utils/data')
const { t } = require('../../utils/i18n')

Page({
  data: {
    routes: ROUTES,
    expandedId: null,
    routeTitle: '',
    routeCount: '',
    startNav: '',
  },

  onLoad() {
    this.setData({
      routeTitle: t('route.title'),
      routeCount: t('route.count', { n: ROUTES.length }),
      startNav: t('route.startNav'),
    })
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
