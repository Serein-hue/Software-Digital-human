const session = require('./utils/session')

App({
  globalData: {
    spotName: '灵山胜境',
    spotId: 'lingshan-buddha',
    isOnline: true,
    messages: [],
    sessionId: null,
  },

  onLaunch() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.safeArea = res.safeArea
        this.globalData.statusBarHeight = res.statusBarHeight
      },
    })

    // 预创建会话（后台静默，不阻塞启动）
    session.ensure({ source: 'miniprogram' }).then((sid) => {
      this.globalData.sessionId = sid
    }).catch(() => {})
  },

  // 全局消息管理
  addMessage(msg) {
    this.globalData.messages.push(msg)
    if (this.globalData.messages.length > 200) {
      this.globalData.messages = this.globalData.messages.slice(-100)
    }
  },
})
