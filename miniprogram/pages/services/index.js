const { t } = require('../../utils/i18n')
const api = require('../../utils/api')
const navigation = require('../../utils/navigation')

const LOCAL_SERVICES = [
  { id: 'toilet-buddha', category: 'toilet', name: '大佛广场卫生间', location: '九龙灌浴广场右侧' },
  { id: 'toilet-fanpalace', category: 'toilet', name: '梵宫一层卫生间', location: '梵宫入口内侧' },
  { id: 'restaurant-suxiang', category: 'restaurant', name: '灵山精舍素斋馆', location: '出口商业街旁' },
  { id: 'restaurant-fanpalace', category: 'restaurant', name: '梵宫自助餐厅', location: '梵宫一层' },
  { id: 'parking-p1', category: 'parking', name: 'P1 南门停车场', location: '景区南门入口' },
  { id: 'help-center', category: 'help_point', name: '游客服务中心', location: '南门入园后右侧' },
]

Page({
  data: {
    title: '', categories: [], activeCategory: 'all', services: [], allServices: [],
    isLoading: true, emptyLabel: '', heroCopy: '', mapHint: '点击导航可直接打开微信地图',
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 2, switching: false })
  },

  onLoad() {
    this.setData({
      title: t('services.title'), emptyLabel: t('services.empty'), heroCopy: t('services.heroCopy'),
      shortcutsTitle: t('services.shortcutsTitle'),
      serviceShortcuts: [
        { key: 'events', label: t('events.title'), glyph: '演', url: '/pages/events/index' },
        { key: 'tickets', label: t('tickets.title'), glyph: '票', url: '/pages/tickets/index' },
        { key: 'feedback', label: t('feedback.title'), glyph: '评', url: '/pages/feedback/index' },
      ],
      categories: [
        { key: 'all', label: t('services.all') }, { key: 'toilet', label: t('services.toilet') },
        { key: 'restaurant', label: t('services.restaurant') }, { key: 'parking', label: t('services.parking') },
        { key: 'help_point', label: t('services.help_point') },
      ],
    })
    this.loadServices()
  },

  loadServices() {
    this.setData({ isLoading: true })
    Promise.all([
      api.getServices().catch(() => LOCAL_SERVICES),
      api.getMapPois().catch(() => []),
    ]).then(([items, pois]) => this._applyServices(items && items.length ? items : LOCAL_SERVICES, pois))
      .catch(() => this._applyServices(LOCAL_SERVICES, []))
  },

  _applyServices(items, pois) {
    const poiIndex = navigation.indexPois(pois)
    const allServices = items.map((service) => ({
      ...service,
      icon: this.iconFor(service.category), color: this.colorFor(service.category),
      categoryLabel: t('services.' + service.category),
      point: navigation.resolvePoint(service.id, service.name, poiIndex[service.name]),
    }))
    this.setData({ allServices, isLoading: false }, () => this.applyCategory(this.data.activeCategory))
    wx.stopPullDownRefresh()
  },

  applyCategory(category) {
    const services = category === 'all' ? this.data.allServices : this.data.allServices.filter((item) => item.category === category)
    this.setData({ activeCategory: category, services })
  },

  navigateService(e) {
    const service = this.data.allServices.find((item) => item.id === e.currentTarget.dataset.id)
    if (service) navigation.openLocation(service.point).catch(() => {})
  },

  openServicePage(e) {
    const { url } = e.currentTarget.dataset
    if (url) wx.navigateTo({ url })
  },

  onCategoryTap(e) { this.applyCategory(e.currentTarget.dataset.category) },

  iconFor(category) {
    const map = { toilet: '卫', restaurant: '餐', parking: '停', help_point: '助', shop: '店', medical: '医' }
    return map[category] || '点'
  },

  colorFor(category) {
    const map = { toilet: '#397eb6', restaurant: '#c97543', parking: '#548246', help_point: '#bf4d45', shop: '#80654c', medical: '#bf4d45' }
    return map[category] || '#155d58'
  },

  onPullDownRefresh() { this.loadServices() },
})
