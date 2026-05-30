const { ROUTES } = require('../../utils/data')

Page({
  data: {
    routes: ROUTES,
    expandedId: null,
  },

  toggleExpand(e) {
    const { id } = e.currentTarget.dataset
    this.setData({
      expandedId: this.data.expandedId === id ? null : id,
    })
  },

  goBack() {
    wx.navigateBack()
  },
})
