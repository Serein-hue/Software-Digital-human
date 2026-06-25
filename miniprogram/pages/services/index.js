const { t } = require('../../utils/i18n')
const api = require('../../utils/api')

Page({
  data: {
    title: '',
    categories: [],
    activeCategory: 'all',
    services: [],
    isLoading: true,
  },

  onLoad() {
    this.setData({
      title: t('services.title'),
      categories: [
        { key: 'all', label: t('services.all'), icon: '📍' },
        { key: 'toilet', label: t('services.toilet'), icon: '🚻' },
        { key: 'restaurant', label: t('services.restaurant'), icon: '🍽' },
        { key: 'parking', label: t('services.parking'), icon: '🅿' },
        { key: 'help_point', label: t('services.help_point'), icon: '🆘' },
      ],
    })
    this.loadServices()
  },

  async loadServices(category) {
    this.setData({ isLoading: true })
    try {
      const params = category && category !== 'all' ? { category } : {}
      const data = await api.getCached('/services', params, { ttl: 120000 })
      this.setData({
        services: (data.items || []).map((s) => ({
          id: s.id,
          category: s.category,
          name: s.name,
          location: s.location,
          icon: this.iconFor(s.category),
          color: this.colorFor(s.category),
        })),
        isLoading: false,
      })
    } catch (e) {
      console.log('[services] API 失败:', e.message)
      this.setData({ isLoading: false })
      wx.showToast({ title: '加载失败，请下拉刷新', icon: 'none' })
    }
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ activeCategory: category })
    this.loadServices(category)
  },

  iconFor(cat) {
    const map = { toilet: '🚻', restaurant: '🍽', parking: '🅿', help_point: '🆘', shop: '🛍', medical: '🏥' }
    return map[cat] || '📍'
  },

  colorFor(cat) {
    const map = { toilet: '#4a90d9', restaurant: '#e89460', parking: '#5a8a4a', help_point: '#d94a4a', shop: '#8a6a4a', medical: '#d94a4a' }
    return map[cat] || '#155d58'
  },

  onPullDownRefresh() {
    this.loadServices(this.data.activeCategory)
    wx.stopPullDownRefresh()
  },

  goBack() {
    wx.navigateBack()
  },
})
