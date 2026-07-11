const { t } = require('../../utils/i18n')
const api = require('../../utils/api')
const navigation = require('../../utils/navigation')

const LOCAL_PRODUCTS = [
  { id: 'adult', name: '成人票', price: 210, status: 'available' },
  { id: 'student', name: '学生票', price: 105, status: 'available' },
  { id: 'senior', name: '60-69 周岁老人票', price: 105, status: 'available' },
]

Page({
  data: {
    title: '', priceLabel: '', verifyLabel: '', verifyPlaceholder: '', verifyBtn: '', verifiedLabel: '',
    validLabel: '', disclaimer: '', products: [], isLoading: true, verifyCode: '', verifyResult: null, verifying: false,
  },

  onLoad() {
    this.setData({
      title: t('tickets.title'), priceLabel: t('tickets.price'), verifyLabel: t('tickets.verify'),
      verifyPlaceholder: t('tickets.verifyPlaceholder'), verifyBtn: t('tickets.verifyBtn'),
      verifiedLabel: t('tickets.verified'), validLabel: t('tickets.valid'), disclaimer: t('tickets.disclaimer'),
      productsLabel: t('tickets.sectionProducts'), availableLabel: t('tickets.available'), unavailableLabel: t('tickets.unavailable'),
    })
    this.loadProducts()
  },

  loadProducts() {
    this.setData({ isLoading: true })
    api.getTicketProducts().then((items) => this._applyProducts(items && items.length ? items : LOCAL_PRODUCTS))
      .catch(() => this._applyProducts(LOCAL_PRODUCTS))
  },

  _applyProducts(products) { this.setData({ products, isLoading: false }); wx.stopPullDownRefresh() },
  onCodeInput(e) { this.setData({ verifyCode: e.detail.value }) },

  scanTicket() {
    if (this.data.verifying) return
    wx.scanCode({
      scanType: ['qrCode', 'barCode'],
      success: ({ result }) => this.setData({ verifyCode: result || '' }, () => this.onVerify()),
      fail: (error) => { if (!error || !String(error.errMsg || '').includes('cancel')) wx.showToast({ title: '未识别到票码', icon: 'none' }) },
    })
  },

  onVerify() {
    if (this.data.verifying) return
    const code = this.data.verifyCode.trim()
    if (!code) { wx.showToast({ title: '请输入或扫描票码', icon: 'none' }); return }
    this.setData({ verifying: true, verifyResult: null })
    setTimeout(() => this.setData({
      verifyResult: { code, status: 'offline', names: [], disclaimer: t('tickets.verifyOffline') }, verifying: false,
    }), 220)
  },

  navigateEntrance() { navigation.openLocation(navigation.FALLBACK_POINTS['south-gate']).catch(() => {}) },
  onPullDownRefresh() { this.loadProducts() },
  goBack() { wx.navigateBack() },
})
