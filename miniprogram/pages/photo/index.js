const MOCK_RESULTS = [
  {
    id: 'r1', name: '灵山大佛', category: '青铜佛像·世界之最',
    confidence: 97.3, description: '世界最高露天青铜释迦牟尼立像，通高88米',
    spotId: 'lingshan-buddha',
  },
  { id: 'r2', name: '灵山梵宫', category: '佛教艺术殿堂', confidence: 91.2, description: '"东方卢浮宫"，世界佛教论坛永久会址', spotId: 'lingshan-fanpalace' },
  { id: 'r3', name: '九龙灌浴', category: '动态音乐群雕', confidence: 84.5, description: '大型音乐动态群雕，重现"花开见佛"', spotId: 'lingshan-jiulong' },
]

Page({
  data: {
    phase: 'scanning',
    progress: 0,
    results: [],
    timer: null,
  },

  onLoad() {
    this.startScan()
  },

  startScan() {
    if (this.data.timer) clearInterval(this.data.timer)
    this.setData({ phase: 'scanning', progress: 0 })

    const timer = setInterval(() => {
      const progress = this.data.progress + 2.5
      if (progress >= 100) {
        clearInterval(timer)
        this.setData({ progress: 100, phase: 'results', results: MOCK_RESULTS })
      } else {
        this.setData({ progress })
      }
    }, 40)
    this.setData({ timer })
  },

  openDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/spot-detail/index?id=${id}` })
  },

  askAbout(e) {
    const { name } = e.currentTarget.dataset
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    if (prevPage) {
      prevPage.onSendText(`给我讲讲${name}`)
    }
    wx.navigateBack()
  },

  goBack() {
    if (this.data.timer) clearInterval(this.data.timer)
    wx.navigateBack()
  },

  onUnload() {
    if (this.data.timer) clearInterval(this.data.timer)
  },
})
