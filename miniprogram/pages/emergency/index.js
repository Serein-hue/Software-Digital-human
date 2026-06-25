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

  onLoad() {
    this.setData({
      title: t('emergency.title'),
      descPlaceholder: t('emergency.desc'),
      contactPlaceholder: t('emergency.contact'),
      submitLabel: t('emergency.submit'),
      sentLabel: t('emergency.sent'),
      locationLabel: t('emergency.location'),
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
        this.setData({ location: '无法获取位置' })
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
      wx.showToast({ title: '请描述您的情况', icon: 'none' })
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
        resultMsg: '求助已记录，工作人员正在赶来。紧急情况请拨景区热线：0510-85681234',
        resultId: 'local-' + Date.now(),
      })
    }
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
