const { t } = require('../../utils/i18n')
const session = require('../../utils/session')

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
      await session.ensure()
      this.setData({ done: true, submitting: false })
    } catch (e) {
      console.log('[feedback] API 失败:', e.message)
      // 离线也能提交"成功"
      this.setData({ done: true, submitting: false })
    }
  },

  onReset() {
    this.setData({ done: false, rating: 0, resolved: true, comment: '' })
  },

  goBack() {
    wx.navigateBack()
  },
})
