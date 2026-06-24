const { t } = require('../../utils/i18n')
const api = require('../../utils/api')

Page({
  data: {
    title: '',
    daily: '',
    events: [],
    isLoading: true,
  },

  onLoad() {
    this.setData({
      title: t('events.title'),
      daily: t('events.daily'),
    })
    this.loadEvents()
  },

  async loadEvents() {
    this.setData({ isLoading: true })
    try {
      const data = await api.get('/events')
      this.setData({
        events: (data.items || []).map((ev) => ({
          id: ev.id,
          name: ev.name,
          time: ev.time,
          spotId: ev.spotId,
          description: ev.description,
          icon: this.iconFor(ev.name),
        })),
        isLoading: false,
      })
    } catch (e) {
      console.log('[events] API 失败:', e.message)
      this.setData({ isLoading: false })
      wx.showToast({ title: '加载失败，请下拉刷新', icon: 'none' })
    }
  },

  iconFor(name) {
    if (name.includes('九龙')) return '🐉'
    if (name.includes('吉祥') || name.includes('颂')) return '🎭'
    if (name.includes('祈福')) return '🙏'
    if (name.includes('禅')) return '🧘'
    return '🎪'
  },

  onPullDownRefresh() {
    this.loadEvents()
    wx.stopPullDownRefresh()
  },

  goBack() {
    wx.navigateBack()
  },
})
