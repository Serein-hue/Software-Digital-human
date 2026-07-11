const FALLBACK_POINTS = {
  'LS-001': { name: '灵山大佛', address: '灵山胜境灵山大佛', latitude: 31.4355, longitude: 120.0952 },
  'LS-002': { name: '灵山梵宫', address: '灵山胜境梵宫', latitude: 31.4322, longitude: 120.0913 },
  'LS-003': { name: '九龙灌浴', address: '灵山胜境九龙灌浴广场', latitude: 31.4338, longitude: 120.0928 },
  'LS-004': { name: '五印坛城', address: '灵山胜境五印坛城', latitude: 31.4317, longitude: 120.0897 },
  'LS-005': { name: '祥符禅寺', address: '灵山胜境祥符禅寺', latitude: 31.4342, longitude: 120.0935 },
  'SV-001': { name: '南门卫生间', address: '景区南门入口右侧', latitude: 31.4308, longitude: 120.0925 },
  'SV-002': { name: '灵山蔬食馆', address: '大佛广场东侧', latitude: 31.4345, longitude: 120.0940 },
  'SV-003': { name: 'P1 停车场', address: '灵山胜境南门主停车场', latitude: 31.4290, longitude: 120.0905 },
  'SV-004': { name: '游客服务中心', address: '景区南门入口', latitude: 31.4305, longitude: 120.0915 },
  'south-gate': { name: '灵山胜境南门检票口', address: '灵山胜境南门入口', latitude: 31.4302, longitude: 120.0918 },
  'toilet-buddha': { name: '大佛广场卫生间', address: '九龙灌浴广场右侧', latitude: 31.4340, longitude: 120.0932 },
  'toilet-fanpalace': { name: '梵宫一层卫生间', address: '梵宫入口内侧', latitude: 31.4320, longitude: 120.0910 },
  'restaurant-suxiang': { name: '灵山精舍素斋馆', address: '出口商业街旁', latitude: 31.4345, longitude: 120.0940 },
  'restaurant-fanpalace': { name: '梵宫自助餐厅', address: '梵宫一层', latitude: 31.4325, longitude: 120.0908 },
  'parking-p1': { name: 'P1 南门停车场', address: '景区南门入口', latitude: 31.4290, longitude: 120.0905 },
  'help-center': { name: '游客服务中心', address: '南门入园后右侧', latitude: 31.4305, longitude: 120.0915 },
}

const NAME_ALIASES = {
  '南门卫生间': 'SV-001', '灵山蔬食馆': 'SV-002', 'P1 停车场': 'SV-003',
  'P1 南门停车场': 'SV-003', '游客服务中心': 'SV-004',
  '灵山大佛': 'LS-001', '灵山梵宫': 'LS-002', '九龙灌浴': 'LS-003',
  '五印坛城': 'LS-004', '祥符禅寺': 'LS-005',
}

function normalizePoint(point, fallback) {
  if (!point) return fallback || null
  const latitude = Number(point.latitude)
  const longitude = Number(point.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return fallback || null
  return {
    name: point.name || (fallback && fallback.name) || '景区地点',
    address: point.address || point.location || point.description || (fallback && fallback.address) || '灵山胜境',
    latitude,
    longitude,
  }
}

function resolvePoint(id, name, point) {
  const aliasId = id || NAME_ALIASES[name]
  const fallback = FALLBACK_POINTS[aliasId] || FALLBACK_POINTS[NAME_ALIASES[name]]
  return normalizePoint(point, fallback)
}

function openLocation(point) {
  const target = normalizePoint(point)
  if (!target) {
    wx.showToast({ title: '暂无可用地图位置', icon: 'none' })
    return Promise.reject(new Error('missing map coordinates'))
  }
  return new Promise((resolve, reject) => {
    wx.openLocation({
      latitude: target.latitude,
      longitude: target.longitude,
      name: target.name,
      address: target.address,
      scale: 17,
      success: resolve,
      fail(error) {
        wx.showModal({
          title: '地图未能打开',
          content: '请确认已允许微信使用地图服务后重试。',
          showCancel: false,
          confirmText: '知道了',
        })
        reject(error)
      },
    })
  })
}

function indexPois(items) {
  return (items || []).reduce((map, item) => {
    if (item.id) map[item.id] = item
    if (item.name) map[item.name] = item
    return map
  }, {})
}

module.exports = { FALLBACK_POINTS, resolvePoint, openLocation, indexPois }
