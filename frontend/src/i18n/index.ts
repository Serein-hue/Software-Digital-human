export type Lang = 'zh' | 'en'

const dict: Record<Lang, Record<string, string>> = {
  zh: {
    'app.title': '灵山胜境 · AI 数字人导览',
    'header.cGuide': 'C端导览',
    'header.dashboard': '数据大屏',
    'header.knowledge': '知识库',
    'header.review': '内容审核',
    'header.dhConfig': '数字人配置',
    'header.settings': '系统设置',
    'header.kiosk': 'Kiosk大屏',
    'header.command': '指挥中心',

    'guide.welcome': '欢迎来到灵山胜境！我是您的 AI 导游小景。您可以随时向我提问，比如"灵山大佛有多高？"或者"推荐一条游览路线"。',
    'guide.title': 'AI 导游',
    'guide.offlineBanner': '弱网模式 · 已缓存基础讲解包，部分功能可能受限',
    'guide.routeRecommend': '推荐路线',
    'guide.tourDuration': '游览时长',
    'guide.photoRecognition': '拍照识景',
    'guide.deepGuide': '深度讲解',
    'guide.photo': '拍照',
    'guide.inputPlaceholder': '输入问题，或按语音键说话...',
    'guide.listening': '正在聆听...',
    'guide.speaking': '正在讲解...',

    'lbs.online': 'GPS 定位中',
    'lbs.offline': '离线定位',
    'lbs.nearSpot': '距 {{spot}} {{distance}}m',

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
    'photo.results': '识别结果',
    'photo.confidence': '置信度',
    'photo.ask': '提问',
    'photo.capture': '拍照识别',

    'route.title': '推荐路线',
    'route.empty': '暂无推荐路线',
    'route.steps': '游览步骤',
    'route.highlights': '亮点',
    'route.startNav': '开始导航',

    'spot.oneLiner': '一句话',
    'spot.30s': '简短版',
    'spot.3min': '深度讲解',
    'spot.playing': '正在播报...',
    'spot.aiAudio': 'AI 语音讲解',
    'spot.nearby': '附近景点',

    'share.title': '分享我的旅程',
    'share.copy': '复制分享语',
    'share.copied': '已复制',
    'share.save': '保存图片',
    'share.classic': '经典',
    'share.warm': '暖色',
    'share.ink': '水墨',

    'kiosk.welcome': '点击屏幕开始体验',
    'kiosk.spots': '景点讲解',
    'kiosk.routes': '路线推荐',
    'kiosk.about': '关于景区',
    'kiosk.voiceHint': '点击话筒提问',
    'kiosk.voiceListening': '聆听中...',
    'kiosk.voiceSpeaking': '讲解中...',
    'kiosk.voiceIdle': '语音提问',
    'kiosk.qrTitle': '扫码继续体验',
    'kiosk.qrDesc': '用手机扫描二维码，AI 导游随时随地陪伴您的旅程',

    'kiosk.aboutTitle': '灵山胜境',
    'kiosk.aboutDesc': '灵山胜境位于江苏省无锡市太湖西北部的马山镇，是国家5A级旅游景区、世界佛教论坛永久会址，被誉为"东方佛国"。景区占地面积约30万平方米，历史可追溯至1300多年前的唐代贞观年间。',
    'kiosk.openTime': '开放时间',
    'kiosk.openTimeVal': '07:00 - 17:30',
    'kiosk.duration': '建议时长',
    'kiosk.durationVal': '4-6 小时',
    'kiosk.ticket': '门票参考',
    'kiosk.ticketVal': '210 元/人',
    'kiosk.phone': '客服电话',

    'cmd.overview': '总览',
    'cmd.demographics': '客群',
    'cmd.revenue': '营收',
    'cmd.status': '态势',
    'cmd.todayVisitors': '今日接待',
    'cmd.inPark': '实时在园',
    'cmd.todayRevenue': '今日营收',
    'cmd.visitorTrend': '月度游客趋势',
    'cmd.topSpots': '热门景点 TOP5',
    'cmd.ageDist': '年龄分布',
    'cmd.genderDist': '性别分布',
    'cmd.satisfaction': '满意度分布',
    'cmd.spending': '人均消费构成',
    'cmd.revenueTrend': '月度营收趋势',
    'cmd.facilities': '设施状态',
    'cmd.alerts': '实时告警',

    'lang.switch': 'English',
  },
  en: {
    'app.title': 'Lingshan · AI Digital Tour Guide',
    'header.cGuide': 'Guide',
    'header.dashboard': 'Dashboard',
    'header.knowledge': 'Knowledge',
    'header.review': 'Review',
    'header.dhConfig': 'Avatar Config',
    'header.settings': 'Settings',
    'header.kiosk': 'Kiosk',
    'header.command': 'Command',

    'guide.welcome': 'Welcome to Lingshan Grand Buddhist Scenic Area! I\'m Xiao Jing, your AI tour guide. Feel free to ask me anything — "How tall is the Grand Buddha?" or "Recommend a route."',
    'guide.title': 'AI Guide',
    'guide.offlineBanner': 'Offline mode · Basic tour pack cached, some features limited',
    'guide.routeRecommend': 'Routes',
    'guide.tourDuration': 'Duration',
    'guide.photoRecognition': 'Photo ID',
    'guide.deepGuide': 'Deep Tour',
    'guide.photo': 'Camera',
    'guide.inputPlaceholder': 'Ask a question, or tap the mic...',
    'guide.listening': 'Listening...',
    'guide.speaking': 'Speaking...',

    'lbs.online': 'GPS Active',
    'lbs.offline': 'GPS Offline',
    'lbs.nearSpot': 'Near {{spot}} ({{distance}}m)',

    'voice.listening': 'Listening...',
    'voice.tapRetry': 'Tap to retry',
    'voice.hintListening': 'Recognizing your speech...',
    'voice.hintDefault': 'Tap a suggestion to quick-input · Tap ✕ to cancel',
    'voice.recognized': 'Recognized, sending...',
    'voice.unsupported': 'Speech recognition not supported in this browser. Please use Chrome or Edge.',
    'voice.denied': 'Microphone access denied. Please enable in browser settings.',
    'voice.error': 'Speech recognition error. Please retry.',
    'voice.cantStart': 'Unable to start speech recognition.',
    'voice.suggestions': 'Try saying:',

    'photo.scanning': 'Recognizing...',
    'photo.hint': 'Hold steady, keep the landmark in frame',
    'photo.rescan': 'Rescan',
    'photo.results': 'Results',
    'photo.confidence': 'Confidence',
    'photo.ask': 'Ask',
    'photo.capture': 'Take Photo',

    'route.title': 'Recommended Routes',
    'route.empty': 'No routes available',
    'route.steps': 'Itinerary',
    'route.highlights': 'Highlights',
    'route.startNav': 'Start Navigation',

    'spot.oneLiner': 'One-Liner',
    'spot.30s': 'Brief',
    'spot.3min': 'In-Depth',
    'spot.playing': 'Playing...',
    'spot.aiAudio': 'AI Audio Guide',
    'spot.nearby': 'Nearby Spots',

    'share.title': 'Share My Journey',
    'share.copy': 'Copy',
    'share.copied': 'Copied',
    'share.save': 'Save Image',
    'share.classic': 'Classic',
    'share.warm': 'Warm',
    'share.ink': 'Ink',

    'kiosk.welcome': 'Tap to Begin',
    'kiosk.spots': 'Spots',
    'kiosk.routes': 'Routes',
    'kiosk.about': 'About',
    'kiosk.voiceHint': 'Tap the mic to ask',
    'kiosk.voiceListening': 'Listening...',
    'kiosk.voiceSpeaking': 'Speaking...',
    'kiosk.voiceIdle': 'Voice',
    'kiosk.qrTitle': 'Scan to Continue',
    'kiosk.qrDesc': 'Scan the QR code with your phone to take the AI guide with you.',

    'kiosk.aboutTitle': 'Lingshan Grand Buddhist Scenic Area',
    'kiosk.aboutDesc': 'Located in Wuxi, Jiangsu Province, Lingshan is a National 5A Tourist Attraction and the permanent venue of the World Buddhist Forum. Covering 300,000 m², its history dates back 1,300 years to the Tang Dynasty.',
    'kiosk.openTime': 'Hours',
    'kiosk.openTimeVal': '07:00 - 17:30',
    'kiosk.duration': 'Suggested Duration',
    'kiosk.durationVal': '4-6 hours',
    'kiosk.ticket': 'Admission',
    'kiosk.ticketVal': '¥210',
    'kiosk.phone': 'Contact',

    'cmd.overview': 'Overview',
    'cmd.demographics': 'Visitors',
    'cmd.revenue': 'Revenue',
    'cmd.status': 'Status',
    'cmd.todayVisitors': 'Today\'s Visitors',
    'cmd.inPark': 'In Park',
    'cmd.todayRevenue': 'Today\'s Revenue',
    'cmd.visitorTrend': 'Monthly Visitor Trend',
    'cmd.topSpots': 'Top 5 Spots',
    'cmd.ageDist': 'Age Distribution',
    'cmd.genderDist': 'Gender Distribution',
    'cmd.satisfaction': 'Satisfaction',
    'cmd.spending': 'Spending Breakdown',
    'cmd.revenueTrend': 'Monthly Revenue Trend',
    'cmd.facilities': 'Facility Status',
    'cmd.alerts': 'Alerts',

    'lang.switch': '中文',
  },
}

let currentLang: Lang = 'zh'
const listeners = new Set<() => void>()

export function t(key: string, params?: Record<string, string | number>): string {
  let text = dict[currentLang]?.[key]
  if (text == null) {
    // fallback to zh
    text = dict.zh[key]
  }
  if (text == null) return key
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text!.replace(`{{${k}}}`, String(v))
    })
  }
  return text
}

export function getLang(): Lang {
  return currentLang
}

export function setLang(lang: Lang) {
  currentLang = lang
  localStorage.setItem('app-lang', lang)
  listeners.forEach((fn) => fn())
}

export function useLang(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Restore from localStorage
const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('app-lang') : null
if (saved === 'en' || saved === 'zh') currentLang = saved
