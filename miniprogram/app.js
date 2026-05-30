App({
  globalData: {
    spotName: '灵山胜境',
    spotId: 'lingshan-buddha',
    isOnline: true,
    messages: [],
  },

  onLaunch() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.safeArea = res.safeArea
        this.globalData.statusBarHeight = res.statusBarHeight
      }
    })
  },

  // 全局消息管理
  addMessage(msg) {
    this.globalData.messages.push(msg)
    if (this.globalData.messages.length > 200) {
      this.globalData.messages = this.globalData.messages.slice(-100)
    }
  },
})
