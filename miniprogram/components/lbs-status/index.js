const { t } = require('../../utils/i18n')

Component({
  properties: {
    spotName: { type: String, value: '灵山胜境南门' },
    distance: { type: Number, value: 320 },
    online: { type: Boolean, value: true },
  },

  lifetimes: {
    attached() {
      this.setData({
        lbsActiveLabel: t('guide.lbsActive'),
        offlineModeLabel: t('guide.offlineMode'),
      })
    },
  },
})
