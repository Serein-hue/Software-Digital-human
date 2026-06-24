const api = require('./utils/api')

App({
  globalData: {
    spotName: '灵山胜境',
    spotId: 'lingshan-buddha',
    isOnline: true,        // 网络可达
    apiOnline: false,      // business-api 服务可达
    messages: [],
  },

  onLaunch() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.safeArea = res.safeArea
        this.globalData.statusBarHeight = res.statusBarHeight
      }
    })

    // 探测 business-api 是否在线
    this._checkApi()
  },

  _checkApi() {
    // 用天气接口做轻量探测
    api.getWeather().then(() => {
      this.globalData.apiOnline = true
      console.log('[App] business-api online')
    }).catch(() => {
      this.globalData.apiOnline = false
      console.log('[App] business-api offline, using mock data')
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
