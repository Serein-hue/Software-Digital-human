const { t } = require('../../utils/i18n')
const navigation = require('../../utils/navigation')

Page({
  data: { stats: [], services: [] },
  onLoad() {
    this.setData({
      title: t('mine.title'), welcome: t('mine.welcome'), subtitle: t('mine.subtitle'), myServices: t('mine.myServices'),
      stats: [
        { value: '5', label: t('mine.visits') }, { value: '12', label: t('mine.questions') }, { value: '3', label: t('mine.favorites') },
      ],
      services: [
        { key: 'map', glyph: '图', label: '游客服务中心导航', map: true },
        { key: 'tickets', glyph: '票', label: t('mine.tickets'), url: '/pages/tickets/index' },
        { key: 'events', glyph: '演', label: t('mine.events'), url: '/pages/events/index' },
        { key: 'feedback', glyph: '评', label: t('mine.feedback'), url: '/pages/feedback/index' },
        { key: 'emergency', glyph: '助', label: t('mine.emergency'), tab: '/pages/emergency/index' },
      ],
    })
  },
  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 4, switching: false })
  },
  openItem(e) {
    const { url, tab, map } = e.currentTarget.dataset
    if (map) navigation.openLocation(navigation.FALLBACK_POINTS['SV-004']).catch(() => {})
    else if (tab) wx.switchTab({ url: tab })
    else if (url) wx.navigateTo({ url })
  },
})
