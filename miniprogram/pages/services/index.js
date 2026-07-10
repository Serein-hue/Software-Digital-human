const { t } = require('../../utils/i18n')

const LOCAL_SERVICES = [
  { id: 'toilet-buddha', category: 'toilet', name: '大佛广场卫生间', location: '灵山大佛广场东侧' },
  { id: 'toilet-fanpalace', category: 'toilet', name: '梵宫一层卫生间', location: '梵宫入口内侧' },
  { id: 'restaurant-suxiang', category: 'restaurant', name: '灵山精舍素斋馆', location: '出口商业街旁' },
  { id: 'restaurant-fanpalace', category: 'restaurant', name: '梵宫自助餐厅', location: '梵宫一层' },
  { id: 'parking-p1', category: 'parking', name: 'P1 南门停车场', location: '景区南门入口' },
  { id: 'help-center', category: 'help_point', name: '游客服务中心', location: '南门入园后右侧' },
]

Page({
  data: {
    title: '',
    categories: [],
    activeCategory: 'all',
    services: [],
    isLoading: true,
    emptyLabel: '',
    heroCopy: '',
  },

  onLoad() {
    this.setData({
      title: t('services.title'),
      emptyLabel: t('services.empty'),
      heroCopy: t('services.heroCopy'),
      categories: [
        { key: 'all', label: t('services.all'), icon: 'ALL' },
        { key: 'toilet', label: t('services.toilet'), icon: 'WC' },
        { key: 'restaurant', label: t('services.restaurant'), icon: '餐' },
        { key: 'parking', label: t('services.parking'), icon: 'P' },
        { key: 'help_point', label: t('services.help_point'), icon: 'SOS' },
      ],
    })
    this.loadServices()
  },

  loadServices(category) {
    const services = category && category !== 'all'
      ? LOCAL_SERVICES.filter((service) => service.category === category)
      : LOCAL_SERVICES

    this.setData({
      services: services.map((service) => ({
        ...service,
        icon: this.iconFor(service.category),
        color: this.colorFor(service.category),
        categoryLabel: t('services.' + service.category),
      })),
      isLoading: false,
    })
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ activeCategory: category })
    this.loadServices(category)
  },

  iconFor(category) {
    const map = { toilet: '卫', restaurant: '餐', parking: '停', help_point: '助', shop: '店', medical: '医' }
    return map[category] || '点'
  },

  colorFor(category) {
    const map = { toilet: '#4a90d9', restaurant: '#e89460', parking: '#5a8a4a', help_point: '#d94a4a', shop: '#8a6a4a', medical: '#d94a4a' }
    return map[category] || '#155d58'
  },

  onPullDownRefresh() {
    this.loadServices(this.data.activeCategory)
    wx.stopPullDownRefresh()
  },

  goBack() {
    wx.navigateBack()
  },
})
