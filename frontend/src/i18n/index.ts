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
