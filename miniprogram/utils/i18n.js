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

    'voice.recording': '正在录音...',
    'voice.tapStart': '点击麦克风开始',
    'voice.recordingHint': '录音最长10秒，点击麦克风停止',
    'voice.idleHint': '轻点提示文字快速输入 · 点击空白处取消',
    'voice.suggestions': '试试说：',
    'voice.recordingError': '录音失败，请重试',
    'voice.mockResult': '给我介绍一下灵山胜境',
    'photo.failToast': '拍照失败，请重试',
    'photo.tellMeAbout': '给我讲讲{{name}}',

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
    'quick.duration': '游览时长',
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

    'voice.recording': 'Recording...',
    'voice.tapStart': 'Tap mic to start',
    'voice.recordingHint': 'Max 10 seconds, tap mic to stop',
    'voice.idleHint': 'Tap a suggestion or tap outside to cancel',
    'voice.suggestions': 'Try saying:',
    'voice.recordingError': 'Recording failed, please retry',
    'voice.mockResult': 'Tell me about Lingshan',
    'photo.failToast': 'Photo failed, please retry',
    'photo.tellMeAbout': 'Tell me about {{name}}',

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
    'quick.duration': 'Duration',
  },
}

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
