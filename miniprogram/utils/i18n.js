const MODERN_DICT = require('./modern-i18n')
const DICT = {
  zh: {
    'app.title': '灵山胜境 · AI 数字人导览',
    'guide.title': 'AI 导游 · 小景',
    'guide.welcome': '欢迎来到灵山胜境！我是您的 AI 导游小景。您可以随时向我提问，比如"灵山大佛有多高？"或者"推荐一条游览路线"。',
    'guide.welcomeShort': '欢迎来到灵山胜境！我是您的 AI 导游小景。',
    'guide.offline': '弱网模式 · 已缓存基础讲解包',
    'guide.speaking': '正在讲解...',
    'guide.listening': '正在聆听...',
    'guide.place': '灵山胜境',
    'guide.photo': '拍照',
    'guide.send': '发送',
    'guide.inputPlaceholder': '问我关于灵山胜境的任何问题...',
    'guide.confirmClear': '确定要清空对话记录吗？',
    'guide.confirm': '确认',
    'guide.toggleOffline': '切换在线/离线',
    'guide.share': '分享',
    'guide.lbsActive': 'LBS 已激活',
    'guide.offlineMode': '弱网模式',

    'voice.recording': '正在录音...',
    'voice.tapStart': '点击麦克风开始',
    'voice.recordingHint': '录音最长10秒，点击麦克风停止',
    'voice.idleHint': '轻点提示文字快速输入 · 点击空白处取消',
    'voice.suggestions': '试试说：',
    'voice.recordingError': '录音失败，请重试',
    'voice.mockResult': '给我介绍一下灵山胜境',
    'photo.failToast': '拍照失败，请重试',
    'photo.tellMeAbout': '给我讲讲{{name}}',
    'photo.capture': '拍照识别',

    'share.title': '灵山胜境 · AI 导游',

    'spot.aiNarration': 'AI 语音讲解',
    'spot.playing': '正在播报...',
    'spot.nearbySpots': '附近景点',
    'spot.oneLine': '一句话',
    'spot.shortVersion': '简短版',
    'spot.deepGuide': '深度讲解',

    'route.title': '推荐路线',
    'route.count': '{{n}} 条精选路线',
    'route.startNav': '开始导航',

    'photo.scanning': '识别中...',
    'photo.hint': '保持稳定，将景点置于框内',
    'photo.rescan': '重新识别',
    'photo.results': '识别结果',
    'photo.confidence': '置信度',
    'photo.ask': '提问',
    'photo.recent': '最近识别',

    'quick.route': '推荐路线',
    'quick.camera': '拍照识景',
    'quick.detail': '深度讲解',
    'quick.tickets': '票务',
    'quick.services': '设施',
    'quick.duration': '游览时长',

    'services.title': '服务设施',
    'services.toilet': '洗手间',
    'services.restaurant': '餐饮',
    'services.parking': '停车场',
    'services.help_point': '求助点',
    'services.all': '全部',

    'events.title': '演出活动',
    'events.daily': '每日演出',

    'tickets.title': '票务中心',
    'tickets.price': '价格',
    'tickets.verify': '核验票码',
    'tickets.verifyPlaceholder': '输入或扫描票码',
    'tickets.verifyBtn': '查询',
    'tickets.verified': '核验结果',
    'tickets.valid': '有效',
    'tickets.disclaimer': '此为票务信息查询，购票请通过官方渠道',

    'emergency.title': '应急求助',
    'emergency.medical': '医疗急救',
    'emergency.lost': '人员走失',
    'emergency.other': '其他求助',
    'emergency.desc': '请描述您的情况',
    'emergency.contact': '您的联系电话',
    'emergency.submit': '提交求助',
    'emergency.sent': '求助已发出，工作人员正在赶来',
    'emergency.location': '当前位置',

    'feedback.title': '服务反馈',
    'feedback.rating': '评分',
    'feedback.comment': '留言（选填）',
    'feedback.submit': '提交反馈',
    'feedback.thanks': '感谢您的反馈！',
    'feedback.resolved': '问题已解决',
  },
  en: {
    'app.title': 'Lingshan · AI Digital Guide',
    'guide.title': 'AI Guide · Xiao Jing',
    'guide.welcome': 'Welcome to Lingshan! I\'m Xiao Jing, your AI guide. Ask me anything — "How tall is the Grand Buddha?" or "Recommend a route."',
    'guide.welcomeShort': 'Welcome to Lingshan! I\'m Xiao Jing, your AI guide.',
    'guide.offline': 'Offline mode · Basic tour pack cached',
    'guide.speaking': 'Speaking...',
    'guide.listening': 'Listening...',
    'guide.place': 'Lingshan',
    'guide.photo': 'Camera',
    'guide.send': 'Send',
    'guide.inputPlaceholder': 'Ask me anything about Lingshan...',
    'guide.confirmClear': 'Clear conversation history?',
    'guide.confirm': 'Confirm',
    'guide.toggleOffline': 'Toggle online/offline',
    'guide.share': 'Share',
    'guide.lbsActive': 'LBS Active',
    'guide.offlineMode': 'Offline',

    'voice.recording': 'Recording...',
    'voice.tapStart': 'Tap mic to start',
    'voice.recordingHint': 'Max 10 seconds, tap mic to stop',
    'voice.idleHint': 'Tap a suggestion or tap outside to cancel',
    'voice.suggestions': 'Try saying:',
    'voice.recordingError': 'Recording failed, please retry',
    'voice.mockResult': 'Tell me about Lingshan',
    'photo.failToast': 'Photo failed, please retry',
    'photo.tellMeAbout': 'Tell me about {{name}}',
    'photo.capture': 'Photo Scan',

    'share.title': 'Lingshan · AI Guide',

    'spot.aiNarration': 'AI Narration',
    'spot.playing': 'Playing...',
    'spot.nearbySpots': 'Nearby Spots',
    'spot.oneLine': 'One-liner',
    'spot.shortVersion': 'Brief',
    'spot.deepGuide': 'Deep Guide',

    'route.title': 'Routes',
    'route.count': '{{n}} curated routes',
    'route.startNav': 'Start',

    'photo.scanning': 'Recognizing...',
    'photo.hint': 'Hold steady, keep the landmark in frame',
    'photo.rescan': 'Rescan',
    'photo.results': 'Results',
    'photo.confidence': 'Confidence',
    'photo.ask': 'Ask',
    'photo.recent': 'Recent',

    'quick.route': 'Routes',
    'quick.camera': 'Photo ID',
    'quick.detail': 'Deep Guide',
    'quick.tickets': 'Tickets',
    'quick.services': 'Services',
    'quick.duration': 'Duration',

    'services.title': 'Services',
    'services.toilet': 'Toilets',
    'services.restaurant': 'Dining',
    'services.parking': 'Parking',
    'services.help_point': 'Help',
    'services.all': 'All',

    'events.title': 'Events',
    'events.daily': 'Daily Shows',

    'tickets.title': 'Tickets',
    'tickets.price': 'Price',
    'tickets.verify': 'Verify Code',
    'tickets.verifyPlaceholder': 'Enter or scan ticket code',
    'tickets.verifyBtn': 'Check',
    'tickets.verified': 'Result',
    'tickets.valid': 'Valid',
    'tickets.disclaimer': 'Info only. Purchase via official channels.',

    'emergency.title': 'Emergency',
    'emergency.medical': 'Medical',
    'emergency.lost': 'Lost Person',
    'emergency.other': 'Other',
    'emergency.desc': 'Describe your situation',
    'emergency.contact': 'Your phone number',
    'emergency.submit': 'Submit SOS',
    'emergency.sent': 'Help is on the way',
    'emergency.location': 'Your Location',

    'feedback.title': 'Feedback',
    'feedback.rating': 'Rating',
    'feedback.comment': 'Comment (optional)',
    'feedback.submit': 'Submit',
    'feedback.thanks': 'Thank you for your feedback!',
    'feedback.resolved': 'Resolved',
  },
}

Object.assign(DICT.zh, MODERN_DICT.zh)
Object.assign(DICT.en, MODERN_DICT.en)

let currentLang = 'zh'

try {
  const saved = wx.getStorageSync('app-lang')
  if (saved === 'en' || saved === 'zh') currentLang = saved
} catch (_) { /* ignore */ }

function t(key, params) {
  let text = DICT[currentLang]?.[key] ?? DICT.zh[key]
  if (text == null) return key
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{{${k}}}`, String(v))
    })
  }
  return text
}

function getLang() {
  return currentLang
}

function setLang(lang) {
  currentLang = lang
  try { wx.setStorageSync('app-lang', lang) } catch (_) { /* ignore */ }
}

function toggleLang() {
  const next = currentLang === 'zh' ? 'en' : 'zh'
  setLang(next)
  return next
}

const VOICE_SUGGESTIONS_ZH = ['灵山大佛有多高？', '帮我推荐一条路线', '九龙灌浴每天几场表演？']
const VOICE_SUGGESTIONS_EN = ['How tall is the Buddha?', 'Recommend a route', 'When are the shows?']

function getSuggestions() {
  return currentLang === 'en' ? VOICE_SUGGESTIONS_EN : VOICE_SUGGESTIONS_ZH
}

module.exports = { t, getLang, setLang, toggleLang, getSuggestions }
