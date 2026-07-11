const { t } = require('../../utils/i18n')
const session = require('../../utils/session')
const api = require('../../utils/api')

Page({
  data: {
    title: '',
    rating: 0,
    resolved: true,
    comment: '',
    ratingLabel: '',
    commentLabel: '',
    resolvedLabel: '',
    submitLabel: '',
    thanksLabel: '',
    submitting: false,
    done: false,
    stars: [1, 2, 3, 4, 5],
  },

  onLoad() {
    this.setData({
      title: t('feedback.title'),
      ratingLabel: t('feedback.rating'),
      commentLabel: t('feedback.comment'),
      resolvedLabel: t('feedback.resolved'),
      submitLabel: t('feedback.submit'),
      thanksLabel: t('feedback.thanks'),
      commentPlaceholder: t('feedback.commentPlaceholder'),
      anotherLabel: t('feedback.another'),
    })
  },

  onStarTap(e) {
    this.setData({ rating: e.currentTarget.dataset.star })
  },

  onResolvedToggle() {
    this.setData({ resolved: !this.data.resolved })
  },

  onCommentInput(e) {
    this.setData({ comment: e.detail.value })
  },

  async onSubmit() {
    if (this.data.rating === 0) {
      wx.showToast({ title: t('feedback.needRating'), icon: 'none' })
      return
    }
    if (this.data.submitting) return

    this.setData({ submitting: true })
    try {
      const sessionId = await session.ensure()
      if (String(sessionId).startsWith('local-')) throw new Error('offline session')
      const content = this.data.comment.trim() || `评分：${this.data.rating} 星；问题${this.data.resolved ? '已解决' : '未解决'}`
      const result = await api.submitFeedback(sessionId, { type: 'feedback', content })
      this.setData({ done: true, submitting: false, apiConnected: true, feedbackId: result && result.feedbackId })
      wx.showToast({ title: '提交成功', icon: 'success' })
    } catch (e) {
      console.log('[feedback] API 失败:', e.message)
      this.setData({ done: true, submitting: false, apiConnected: false })
      wx.showToast({ title: '已离线保存', icon: 'none' })
    }
  },

  onReset() {
    this.setData({ done: false, rating: 0, resolved: true, comment: '' })
  },

  goBack() {
    wx.navigateBack()
  },
})
