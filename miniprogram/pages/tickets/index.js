const { t } = require('../../utils/i18n')

const LOCAL_PRODUCTS = [
  { id: 'adult', name: '成人票', price: 210, status: 'available' },
  { id: 'student', name: '学生票', price: 105, status: 'available' },
  { id: 'senior', name: '60-69 周岁老人票', price: 105, status: 'available' },
]

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

  loadProducts() {
    this.setData({ products: LOCAL_PRODUCTS, isLoading: false })
  },

  onCodeInput(e) {
    this.setData({ verifyCode: e.detail.value })
  },

  onVerify() {
    const code = this.data.verifyCode.trim()
    if (!code) return

    this.setData({ verifying: true, verifyResult: null })
    setTimeout(() => {
      this.setData({
        verifyResult: {
          code,
          status: 'offline',
          names: [],
          disclaimer: '当前演示后端未接入票务核销，真实验票请以景区官方系统为准。',
        },
        verifying: false,
      })
    }, 300)
  },

  onPullDownRefresh() {
    this.loadProducts()
    wx.stopPullDownRefresh()
  },

  goBack() {
    wx.navigateBack()
  },
})
