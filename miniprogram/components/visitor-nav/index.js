const { t } = require('../../utils/i18n')

Component({
  properties: {
    active: { type: String, value: 'guide' },
  },

  data: {
    items: [],
  },

  lifetimes: {
    attached() {
      this.setData({
        items: [
          { key: 'guide', label: t('guide.navGuide'), glyph: '导', url: '/pages/guide/index' },
          { key: 'route', label: t('guide.navRoute'), glyph: '线', url: '/pages/route/index' },
          { key: 'services', label: t('guide.navServices'), glyph: '服', url: '/pages/services/index' },
          { key: 'emergency', label: t('guide.navEmergency'), glyph: '助', url: '/pages/emergency/index', danger: true },
          { key: 'mine', label: t('guide.navMine'), glyph: '我', url: '/pages/mine/index' },
        ],
      })
    },
  },

  methods: {
    navigate(e) {
      const { key, url } = e.currentTarget.dataset
      if (!url) return
      wx.switchTab({ url })
    },
  },
})
