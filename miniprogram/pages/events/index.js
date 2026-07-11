const { t } = require('../../utils/i18n')
const api = require('../../utils/api')
const navigation = require('../../utils/navigation')

const LOCAL_EVENTS = [
  { id: 'jiulong-1000', name: '九龙灌浴', time: '10:00', spotId: 'LS-003', description: '大型动态音乐群雕表演' },
  { id: 'jiulong-1330', name: '九龙灌浴', time: '13:30', spotId: 'LS-003', description: '建议提前 10 分钟到场' },
  { id: 'xiangfu-bell', name: '祥符禅钟祈福', time: '全天', spotId: 'LS-005', description: '千年古刹祈福体验' },
]
const DETAIL_IDS = { 'LS-001': 'lingshan-buddha', 'LS-002': 'lingshan-fanpalace', 'LS-003': 'lingshan-jiulong', 'LS-004': 'lingshan-mandala', 'LS-005': 'lingshan-xiangfu' }
const LEGACY_IDS = { 'lingshan-buddha': 'LS-001', 'lingshan-fanpalace': 'LS-002', 'lingshan-jiulong': 'LS-003', 'lingshan-mandala': 'LS-004', 'lingshan-xiangfu': 'LS-005' }

Page({
  data: { title: '', daily: '', events: [], isLoading: true },

  onLoad() {
    this.setData({ title: t('events.title'), daily: t('events.daily'), emptyLabel: t('events.empty'), nextLabel: t('events.next') })
    this.loadEvents()
  },

  loadEvents() {
    this.setData({ isLoading: true })
    Promise.all([api.getEvents().catch(() => LOCAL_EVENTS), api.getMapPois().catch(() => [])])
      .then(([items, pois]) => this._applyEvents(items && items.length ? items : LOCAL_EVENTS, pois))
      .catch(() => this._applyEvents(LOCAL_EVENTS, []))
  },

  _applyEvents(items, pois) {
    const poiIndex = navigation.indexPois(pois)
    const events = items.map((event) => {
      const spotId = LEGACY_IDS[event.spotId] || event.spotId
      const point = navigation.resolvePoint(spotId, event.name, poiIndex[event.name])
      return { ...event, spotId, icon: this.iconFor(event.name), location: point ? point.name : '灵山胜境', point }
    })
    this.setData({ events, isLoading: false })
    wx.stopPullDownRefresh()
  },

  openEvent(e) {
    const id = DETAIL_IDS[e.currentTarget.dataset.spotId]
    if (id) wx.navigateTo({ url: '/pages/spot-detail/index?id=' + id })
    else wx.showToast({ title: '暂无关联景点', icon: 'none' })
  },

  navigateEvent(e) {
    const event = this.data.events.find((item) => item.id === e.currentTarget.dataset.id)
    if (event) navigation.openLocation(event.point).catch(() => {})
  },

  iconFor(name) { if (name.includes('九龙')) return '龙'; if (name.includes('钟')) return '钟'; return '演' },
  onPullDownRefresh() { this.loadEvents() },
  goBack() { wx.navigateBack() },
})
