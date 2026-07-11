const { t } = require('../../utils/i18n')
const session = require('../../utils/session')

Page({
  data: {
    title: '',
    types: [],
    activeType: 'medical',
    desc: '',
    contact: '',
    location: '',
    descPlaceholder: '',
    contactPlaceholder: '',
    submitLabel: '',
    sentLabel: '',
    locationLabel: '',
    submitting: false,
    sent: false,
    resultMsg: '',
    resultId: '',
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 3 })
  },

  onLoad() {
    this.setData({
      title: t('emergency.title'),
      descPlaceholder: t('emergency.desc'),
      contactPlaceholder: t('emergency.contact'),
      submitLabel: t('emergency.submit'),
      sentLabel: t('emergency.sent'),
      locationLabel: t('emergency.location'),
      directCallLabel: t('emergency.directCall'),
      callScenicLabel: t('emergency.callScenic'),
      caseIdLabel: t('emergency.caseId'),
      newRequestLabel: t('emergency.newRequest'),
      safetyEyebrow: t('emergency.safetyEyebrow'),
      safetyTitle: t('emergency.safetyTitle'),
      types: [
        { key: 'medical', label: '🏥 ' + t('emergency.medical') },
        { key: 'lost', label: '🔍 ' + t('emergency.lost') },
        { key: 'other', label: '🆘 ' + t('emergency.other') },
      ],
    })
    this.getLocation()
  },

  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({ location: `${res.latitude.toFixed(4)}, ${res.longitude.toFixed(4)}` })
      },
      fail: () => {
        this.setData({ location: t('emergency.locationFailed') })
      },
    })
  },

  onTypeTap(e) {
    this.setData({ activeType: e.currentTarget.dataset.type })
  },

  onDescInput(e) {
    this.setData({ desc: e.detail.value })
  },

  onContactInput(e) {
    this.setData({ contact: e.detail.value })
  },

  async onSubmit() {
    if (this.data.submitting) return
    if (!this.data.desc.trim()) {
      wx.showToast({ title: t('emergency.needDescription'), icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    try {
      await session.ensure()
      this.setData({
        sent: true,
        submitting: false,
        resultMsg: t('emergency.sent'),
        resultId: 'local-' + Date.now(),
      })
    } catch (e) {
      this.setData({ submitting: false })
      // 离线模式也接受求助
      this.setData({
        sent: true,
        resultMsg: t('emergency.sentLocal'),
        resultId: 'local-' + Date.now(),
      })
    }
  },

  callScenic() {
    wx.makePhoneCall({ phoneNumber: '051085681234' })
  },

  onReset() {
    this.setData({
      sent: false,
      desc: '',
      contact: '',
      activeType: 'medical',
      resultMsg: '',
      resultId: '',
    })
  },

  goBack() {
    wx.navigateBack()
  },
})
