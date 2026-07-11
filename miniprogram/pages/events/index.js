const { t } = require('../../utils/i18n')
const api = require('../../utils/api')

const LOCAL_EVENTS = [
  { id: 'jiulong-1000', name: '九龙灌浴', time: '10:00', spotId: 'lingshan-jiulong', description: '大型动态音乐群雕表演' },
  { id: 'jiulong-1330', name: '九龙灌浴', time: '13:30', spotId: 'lingshan-jiulong', description: '建议提前 10 分钟到场' },
  { id: 'xiangfu-bell', name: '祥符禅钟祈福', time: '全天', spotId: 'lingshan-xiangfu', description: '千年古刹祈福体验' },
]

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
      emptyLabel: t('events.empty'),
      nextLabel: t('events.next'),
    })
    this.loadEvents()
  },

  loadEvents() {
    this.setData({ isLoading: true })
    api.getEvents()
      .then((items) => this._applyEvents(items && items.length ? items : LOCAL_EVENTS, true))
      .catch(() => this._applyEvents(LOCAL_EVENTS, false))
  },

  _applyEvents(items, apiConnected) {
    this.setData({ events: items.map((event) => ({ ...event, icon: this.iconFor(event.name) })), isLoading: false, apiConnected })
    wx.stopPullDownRefresh()
  },

  iconFor(name) {
    if (name.includes('九龙')) return '龙'
    if (name.includes('钟')) return '钟'
    return '演出'
  },

  onPullDownRefresh() {
    this.loadEvents()
  },

  goBack() {
    wx.navigateBack()
  },
})
