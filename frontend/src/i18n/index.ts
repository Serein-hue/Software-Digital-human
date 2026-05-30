import { useState, useEffect } from 'react'

export type Lang = 'zh' | 'en'

const dict: Record<Lang, Record<string, string>> = {
  zh: {
    'app.title': '灵山胜境 · AI 数字人导览',

    'guide.welcome': '欢迎来到灵山胜境！我是您的 AI 导游小景。您可以随时向我提问，比如"灵山大佛有多高？"或者"推荐一条游览路线"。',
    'guide.title': 'AI 导游',
    'guide.offlineBanner': '弱网模式 · 已缓存基础讲解包，部分功能可能受限',
    'guide.routeRecommend': '推荐路线',
    'guide.tourDuration': '游览时长',
    'guide.photoRecognition': '拍照识景',
    'guide.deepGuide': '深度讲解',
    'guide.photo': '拍照',
    'guide.inputPlaceholder': '输入问题，或按语音键说话...',

    'voice.listening': '正在聆听...',
    'voice.tapRetry': '点击重试',
    'voice.hintListening': '正在识别您的语音...',
    'voice.hintDefault': '轻点提示文字可快速输入 · 点击 ✕ 取消',
    'voice.recognized': '已识别，正在发送...',
    'voice.unsupported': '当前浏览器不支持语音识别，请使用 Chrome 或 Edge',
    'voice.denied': '麦克风权限被拒绝，请在浏览器设置中开启',
    'voice.error': '语音识别出错，请重试',
    'voice.cantStart': '无法启动语音识别',
    'voice.suggestions': '试试说：',

    'photo.scanning': '识别中...',
    'photo.hint': '保持稳定，将景点置于框内',
    'photo.rescan': '重新识别',
    'photo.capture': '拍照识别',
    'photo.results': '识别结果',
    'photo.confidence': '置信度',
    'photo.ask': '提问',
    'photo.recent': '最近识别',

    'spot.oneLine': '一句话',
    'spot.shortVersion': '简短版',
    'spot.deepGuide': '深度讲解',
    'spot.aiNarration': 'AI 语音讲解',
    'spot.playing': '正在播报...',
    'spot.nearbySpots': '附近景点',

    'voice.retry': '重试',

    'route.title': '推荐路线',
    'route.count': '{{n}} 条精选路线',
    'route.startNav': '开始导航',

    'kiosk.title': '灵山胜境 · AI 智能导览',
    'kiosk.tapToStart': '点击屏幕开始体验',
    'kiosk.tabSpots': '景点讲解',
    'kiosk.tabRoutes': '路线推荐',
    'kiosk.tabAbout': '关于景区',
    'kiosk.backToList': '返回景点列表',
    'kiosk.audioDuration': '{{dur}} 讲解',
    'kiosk.aboutTitle': '灵山胜境',
    'kiosk.aboutDesc': '灵山胜境位于江苏省无锡市太湖西北部的马山镇，是国家5A级旅游景区、世界佛教论坛永久会址，被誉为"东方佛国"。景区占地面积约30万平方米，历史可追溯至1300多年前的唐代贞观年间。',
    'kiosk.openTime': '开放时间',
    'kiosk.suggestedDuration': '建议时长',
    'kiosk.ticketRef': '门票参考',
    'kiosk.servicePhone': '客服电话',
    'kiosk.micHint': '点击话筒提问',
    'kiosk.micExamples': '"灵山大佛有多高？" "推荐一条路线"',
    'kiosk.micListening': '聆听中...',
    'kiosk.micSpeaking': '讲解中...',
    'kiosk.micIdle': '语音提问',
    'kiosk.qrTitle': '扫码继续体验',
    'kiosk.qrDesc': '用手机扫描二维码，AI 导游随时随地陪伴您的旅程',
    'kiosk.qrWechat': '支持微信扫码',
    'kiosk.qrBrowser': '手机浏览器',

    'lang.switch': 'English',
  },
  en: {
    'app.title': 'Lingshan · AI Digital Tour Guide',

    'guide.welcome': 'Welcome to Lingshan! I\'m Xiao Jing, your AI guide. Ask me anything — "How tall is the Grand Buddha?" or "Recommend a route."',
    'guide.title': 'AI Guide',
    'guide.offlineBanner': 'Offline mode · Basic tour pack cached, some features limited',
    'guide.routeRecommend': 'Routes',
    'guide.tourDuration': 'Duration',
    'guide.photoRecognition': 'Photo ID',
    'guide.deepGuide': 'Deep Tour',
    'guide.photo': 'Camera',
    'guide.inputPlaceholder': 'Ask a question, or tap the mic...',

    'voice.listening': 'Listening...',
    'voice.tapRetry': 'Tap to retry',
    'voice.hintListening': 'Recognizing your speech...',
    'voice.hintDefault': 'Tap a suggestion or press X to cancel',
    'voice.recognized': 'Recognized, sending...',
    'voice.unsupported': 'Speech recognition not supported. Please use Chrome or Edge.',
    'voice.denied': 'Microphone access denied. Check browser settings.',
    'voice.error': 'Speech recognition error. Please retry.',
    'voice.cantStart': 'Unable to start speech recognition.',
    'voice.suggestions': 'Try saying:',

    'photo.scanning': 'Recognizing...',
    'photo.hint': 'Hold steady, keep the landmark in frame',
    'photo.rescan': 'Rescan',
    'photo.capture': 'Take Photo',
    'photo.results': 'Results',
    'photo.confidence': 'Confidence',
    'photo.ask': 'Ask',
    'photo.recent': 'Recent',

    'spot.oneLine': 'One-liner',
    'spot.shortVersion': 'Brief',
    'spot.deepGuide': 'Deep Guide',
    'spot.aiNarration': 'AI Narration',
    'spot.playing': 'Playing...',
    'spot.nearbySpots': 'Nearby Spots',

    'voice.retry': 'Retry',

    'route.title': 'Recommended Routes',
    'route.count': '{{n}} curated routes',
    'route.startNav': 'Start Navigation',

    'kiosk.title': 'Lingshan · AI Smart Guide',
    'kiosk.tapToStart': 'Tap screen to begin',
    'kiosk.tabSpots': 'Spots',
    'kiosk.tabRoutes': 'Routes',
    'kiosk.tabAbout': 'About',
    'kiosk.backToList': 'Back to spots',
    'kiosk.audioDuration': '{{dur}} audio',
    'kiosk.aboutTitle': 'Lingshan',
    'kiosk.aboutDesc': 'Lingshan is located in Mashan Town, Wuxi, Jiangsu Province. It is a national 5A scenic spot and permanent site of the World Buddhist Forum. Covering ~300,000 m², its history dates back 1,300 years to the Tang Dynasty.',
    'kiosk.openTime': 'Hours',
    'kiosk.suggestedDuration': 'Suggested',
    'kiosk.ticketRef': 'Admission',
    'kiosk.servicePhone': 'Hotline',
    'kiosk.micHint': 'Tap mic to ask',
    'kiosk.micExamples': '"How tall is the Buddha?" "Suggest a route"',
    'kiosk.micListening': 'Listening...',
    'kiosk.micSpeaking': 'Speaking...',
    'kiosk.micIdle': 'Voice Input',
    'kiosk.qrTitle': 'Scan to continue',
    'kiosk.qrDesc': 'Scan the QR code and take your AI guide anywhere',
    'kiosk.qrWechat': 'WeChat',
    'kiosk.qrBrowser': 'Browser',

    'lang.switch': '中文',
  },
}

let currentLang: Lang = 'zh'
const listeners = new Set<() => void>()

export function t(key: string, params?: Record<string, string | number>): string {
  let text = dict[currentLang]?.[key] ?? dict.zh[key]
  if (text == null) return key
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text!.replace(`{{${k}}}`, String(v))
    })
  }
  return text
}

export function getLang(): Lang { return currentLang }

export function setLang(lang: Lang) {
  currentLang = lang
  if (typeof localStorage !== 'undefined') localStorage.setItem('app-lang', lang)
  listeners.forEach((fn) => fn())
}

export function useT() {
  const [, bump] = useState(0)
  useEffect(() => {
    const cb = () => bump((n) => n + 1)
    listeners.add(cb)
    return () => { listeners.delete(cb) }
  }, [])
  return t
}

if (typeof localStorage !== 'undefined') {
  const saved = localStorage.getItem('app-lang')
  if (saved === 'en' || saved === 'zh') currentLang = saved
}
