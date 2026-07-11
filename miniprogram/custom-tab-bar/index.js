Component({
  data: {
    selected: 0,
    items: [
      { pagePath: '/pages/guide/index', text: '导览', glyph: '导' },
      { pagePath: '/pages/route/index', text: '路线', glyph: '线' },
      { pagePath: '/pages/services/index', text: '服务', glyph: '服' },
      { pagePath: '/pages/emergency/index', text: '求助', glyph: '助', danger: true },
      { pagePath: '/pages/mine/index', text: '我的', glyph: '我' },
    ],
  },
  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset
      if (index === this.data.selected) return
      wx.switchTab({ url: path })
    },
  },
})
