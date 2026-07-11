Component({
  data: {
    selected: 0,
    switching: false,
    items: [
      { pagePath: '/pages/guide/index', text: '导览' },
      { pagePath: '/pages/route/index', text: '路线' },
      { pagePath: '/pages/services/index', text: '服务' },
      { pagePath: '/pages/emergency/index', text: '求助', danger: true },
      { pagePath: '/pages/mine/index', text: '我的' },
    ],
  },
  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset
      if (this.data.switching) return
      if (index === this.data.selected) { wx.pageScrollTo({ scrollTop: 0, duration: 120 }); return }
      this.setData({ selected: index, switching: true })
      wx.switchTab({ url: path, fail: () => this.setData({ switching: false }) })
    },
  },
})
