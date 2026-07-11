const { t } = require('../../utils/i18n')

Component({
  properties: { active: { type: String, value: 'guide' } },
  data: { items: [], switching: false },
  lifetimes: {
    attached() {
      this.setData({ items: [
        { key: 'guide', label: t('guide.navGuide'), url: '/pages/guide/index' },
        { key: 'route', label: t('guide.navRoute'), url: '/pages/route/index' },
        { key: 'services', label: t('guide.navServices'), url: '/pages/services/index' },
        { key: 'emergency', label: t('guide.navEmergency'), url: '/pages/emergency/index', danger: true },
        { key: 'mine', label: t('guide.navMine'), url: '/pages/mine/index' },
      ] })
    },
  },
  methods: {
    navigate(e) {
      const { key, url } = e.currentTarget.dataset
      if (!url || this.data.switching) return
      this.setData({ switching: true })
      wx.switchTab({ url, complete: () => this.setData({ switching: false }) })
    },
  },
})
