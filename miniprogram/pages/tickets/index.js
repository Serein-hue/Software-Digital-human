const { t } = require('../../utils/i18n')
const api = require('../../utils/api')

Page({
  data: {
    title: '',
    priceLabel: '',
    verifyLabel: '',
    verifyPlaceholder: '',
    verifyBtn: '',
    verifiedLabel: '',
    validLabel: '',
    disclaimer: '',
    products: [],
    isLoading: true,
    verifyCode: '',
    verifyResult: null,
    verifying: false,
  },

  onLoad() {
    this.setData({
      title: t('tickets.title'),
      priceLabel: t('tickets.price'),
      verifyLabel: t('tickets.verify'),
      verifyPlaceholder: t('tickets.verifyPlaceholder'),
      verifyBtn: t('tickets.verifyBtn'),
      verifiedLabel: t('tickets.verified'),
      validLabel: t('tickets.valid'),
      disclaimer: t('tickets.disclaimer'),
    })
    this.loadProducts()
  },

  async loadProducts() {
    this.setData({ isLoading: true })
    try {
      const data = await api.get('/tickets/products')
      this.setData({
        products: (data.items || []).map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          status: p.status,
        })),
        isLoading: false,
      })
    } catch (e) {
      console.log('[tickets] API 失败:', e.message)
      this.setData({ isLoading: false })
    }
  },

  onCodeInput(e) {
    this.setData({ verifyCode: e.detail.value })
  },

  async onVerify() {
    const code = this.data.verifyCode.trim()
    if (!code) return

    this.setData({ verifying: true, verifyResult: null })
    try {
      const data = await api.post('/tickets/verify', { ticket_code: code })
      this.setData({
        verifyResult: {
          code,
          status: data.status,
          names: data.ticketNames || [],
          disclaimer: data.disclaimer || '',
        },
        verifying: false,
      })
    } catch (e) {
      this.setData({
        verifyResult: { code, status: 'invalid', names: [], disclaimer: e.message },
        verifying: false,
      })
    }
  },

  onPullDownRefresh() {
    this.loadProducts()
    wx.stopPullDownRefresh()
  },

  goBack() {
    wx.navigateBack()
  },
})
