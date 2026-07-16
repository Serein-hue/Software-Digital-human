/**
 * 内置演示数据 — 后端不可用时自动降级使用，确保 GitHub Pages 也能展示完整功能
 * 所有数据基于灵山胜境官方资料
 */

import type {
  OverviewData, SpotHeatData, CrowdFlowData, QueueStatsData,
  CommandCenterData, KbStatus, SourceItem, QAItem,
  AdminUser, AvatarItem, VoiceItem,
  WorkOrder, Emergency, Feedback,
  ReviewItem, ConfigItem, RuntimeStatus,
} from './admin'
import type { SpotItem, RouteItem, RagQueryResult } from './index'

interface PaginatedData<T> {
  items: T[]
  pagination: { page: number; page_size: number; total: number; total_pages: number }
}

// ── 导游端数据 ──────────────────────────────────────────────────────

export const MOCK_SPOTS: SpotItem[] = [
  { id: 'LS-011', name: '灵山大佛', nameEn: 'Lingshan Giant Buddha', tags: ['核心景点', '祈福'], location: '秦履峰南侧', summary: '世界最高露天青铜释迦牟尼立像', intro: '灵山大佛通高88米，用铜725吨，由2000块铸铜面板拼接而成。', highlights: ['抱佛脚祈福', '俯瞰太湖', '216级登云道'], source: '景点结构化数据集', freshnessLevel: 'high', scenicId: 'SA-001' },
  { id: 'LS-012', name: '灵山梵宫', nameEn: 'Lingshan Palace', tags: ['文化', '演出'], location: '灵山大佛基座内', summary: '被誉为东方卢浮宫', intro: '建筑面积7.2万㎡，汇集东阳木雕、琉璃巨制等传统工艺。', highlights: ['星空穹顶', '吉祥颂演出', '琉璃巨制'], source: '景点结构化数据集', freshnessLevel: 'high', scenicId: 'SA-001' },
  { id: 'LS-013', name: '九龙灌浴', nameEn: 'Nine-Dragon Bath', tags: ['表演', '亲子'], location: '景区中轴线核心', summary: '动态音乐群雕表演', intro: '总高27.2米，青铜重量260吨，每日4-5场表演。', highlights: ['太子佛旋转升起', '接取圣水', '音乐喷泉'], source: '景点结构化数据集', freshnessLevel: 'high', scenicId: 'SA-001' },
  { id: 'LS-014', name: '五印坛城', tags: ['文化', '打卡'], location: '香水海中央', summary: '藏式碉楼风格建筑', intro: '五层重檐楼宇，总高约30米，108个转经筒。', highlights: ['转经筒祈福', '藏式建筑', '顶层观景'], source: '景点结构化数据集', freshnessLevel: 'high', scenicId: 'SA-001' },
  { id: 'LS-015', name: '祥符禅寺', tags: ['历史', '祈福'], location: '秦履峰北侧', summary: '始建于唐贞观年间', intro: '玄奘法师弟子窥基大师开坛讲经，千年古刹。', highlights: ['千年银杏', '祥符禅钟', '古刹祈福'], source: '景点结构化数据集', freshnessLevel: 'high', scenicId: 'SA-001' },
  { id: 'LS-016', name: '佛手广场', tags: ['打卡', '亲子'], location: '入口区域', summary: '巨型佛手雕塑', intro: '互动祈福区域，游客可参与摸掌祈福活动。', highlights: ['摸掌祈福', '拍照打卡'], source: '景点结构化数据集', freshnessLevel: 'medium', scenicId: 'SA-001' },
  { id: 'LS-017', name: '百子戏弥勒', tags: ['亲子', '打卡'], location: '佛手广场东侧', summary: '青铜雕塑群', intro: '百个孩童嬉戏场景，形态各异，栩栩如生。', highlights: ['亲子拍照', '青铜艺术'], source: '景点结构化数据集', freshnessLevel: 'medium', scenicId: 'SA-001' },
  { id: 'LS-018', name: '降魔成道', tags: ['文化', '艺术'], location: '菩提大道', summary: '大型浮雕壁画', intro: '讲述佛陀成道故事，艺术价值极高。', highlights: ['佛教艺术', '浮雕壁画'], source: '景点结构化数据集', freshnessLevel: 'medium', scenicId: 'SA-001' },
  { id: 'LS-019', name: '阿育王柱', tags: ['打卡', '文化'], location: '菩提大道入口', summary: '高16.9米重200吨', intro: '雕刻精美，具有重要历史文化价值。', highlights: ['古印度风格', '雕刻艺术'], source: '景点结构化数据集', freshnessLevel: 'medium', scenicId: 'SA-001' },
  { id: 'LS-020', name: '灵山精舍', tags: ['服务', '餐饮'], location: '景区东侧', summary: '素斋馆', intro: '人均68元起，提供正宗素斋。', highlights: ['素斋体验', '禅意环境'], source: '游览指南', freshnessLevel: 'medium', scenicId: 'SA-001' },
]

export const MOCK_ROUTES: RouteItem[] = [
  {
    id: 'R1', name: '经典祈福路线', type: '推荐', duration: '约6小时', persona: '首次游览', tips: '建议上午9点前入园', source: '官方推荐',
    stops: [
      { order: 1, spotId: 'LS-015', spotName: '祥符禅寺', stayDuration: '40min', description: '千年古刹，感受佛教文化底蕴' },
      { order: 2, spotId: 'LS-011', spotName: '灵山大佛', stayDuration: '60min', description: '登顶抱佛脚，俯瞰太湖' },
      { order: 3, spotId: 'LS-012', spotName: '灵山梵宫', stayDuration: '90min', description: '参观东方卢浮宫，看吉祥颂' },
      { order: 4, spotId: 'LS-014', spotName: '五印坛城', stayDuration: '30min', description: '转动108个转经筒祈福' },
    ],
  },
  {
    id: 'R2', name: '亲子欢乐路线', type: '推荐', duration: '约4小时', persona: '亲子家庭', tips: '节奏轻松，出口旁有素面餐厅', source: '官方推荐',
    stops: [
      { order: 1, spotId: 'LS-013', spotName: '九龙灌浴', stayDuration: '30min', description: '孩子最爱的动态表演' },
      { order: 2, spotId: 'LS-016', spotName: '佛手广场', stayDuration: '20min', description: '摸掌祈福，亲子互动' },
      { order: 3, spotId: 'LS-017', spotName: '百子戏弥勒', stayDuration: '20min', description: '亲子拍照打卡' },
      { order: 4, spotId: 'LS-011', spotName: '灵山大佛', stayDuration: '45min', description: '全家一起抱佛脚' },
      { order: 5, spotId: 'LS-012', spotName: '灵山梵宫', stayDuration: '60min', description: '看《吉祥颂》演出' },
    ],
  },
  {
    id: 'R3', name: '文化深度游', type: '推荐', duration: '约5小时', persona: '文化爱好者', tips: '建议配合语音导览', source: '官方推荐',
    stops: [
      { order: 1, spotId: 'LS-018', spotName: '降魔成道', stayDuration: '20min', description: '欣赏大型浮雕壁画' },
      { order: 2, spotId: 'LS-019', spotName: '阿育王柱', stayDuration: '15min', description: '了解古印度风格石柱' },
      { order: 3, spotId: 'LS-012', spotName: '灵山梵宫', stayDuration: '90min', description: '细品东方卢浮宫艺术' },
      { order: 4, spotId: 'LS-014', spotName: '五印坛城', stayDuration: '30min', description: '体验藏式佛教文化' },
      { order: 5, spotId: 'LS-011', spotName: '灵山大佛', stayDuration: '60min', description: '登顶参拜世界最高立佛' },
    ],
  },
]

const QA_MAP: Record<string, string> = {
  '灵山大佛': '灵山大佛位于无锡灵山胜境秦履峰南侧，是世界上最高的露天青铜释迦牟尼立像。佛像通高88米（佛体79米+莲花瓣9米），含台基总高101.5米，总用铜量725吨。右手施无畏印除却众生痛苦，左手施与愿印赐予众生欢乐。登216级登云道抱佛脚，可俯瞰太湖全景。开放时间8:00-17:00。',
  '梵宫': '灵山梵宫建筑面积7.2万平方米，最高处66.5米，被誉为东方卢浮宫。内部汇集东阳木雕、琉璃、油画、景泰蓝等传统工艺，28米高星空穹顶用100公斤纯金绘制。核心琉璃巨制《华藏世界》由160块彩色琉璃拼接而成。每日上演《灵山吉祥颂》大型演出。',
  '九龙灌浴': '九龙灌浴位于景区中轴线核心，总高27.2米，青铜重量260吨。每日4-5场表演（10:00、11:30、13:30、15:00），莲花瓣缓缓开启，太子佛在九龙喷泉与《佛之诞》音乐中旋转升起。每场约15分钟。',
  '门票': '灵山胜境成人票210元/人，学生票105元/人，60-69岁老人105元/人，70岁以上免票。观光车20元/人。建议通过官方小程序提前购票。',
  '开放时间': '旺季（3月-10月）7:30-17:30，淡季（8:00-17:00）。灵山大佛8:00-17:00，梵宫9:00-17:00。',
  '路线': '推荐经典路线：南门→灵山大照壁→佛手广场→祥符禅寺→灵山大佛→梵宫→五印坛城→出口。全程约6小时，建议上午9点前入园。',
  '交通': '无锡火车站乘88路直达约90分钟。自驾导航灵山胜境，停车场10元/次。从市区约1小时车程。',
  '演出': '梵宫《灵山吉祥颂》10:35、11:30、14:00、16:00。九龙灌浴10:00、11:30、13:30、15:00。周末加场。',
}

export function getMockChatAnswer(query: string): { answer: string; source: string; confidence: 'high' | 'medium' | 'low' } {
  for (const [key, answer] of Object.entries(QA_MAP)) {
    if (query.includes(key)) return { answer, source: '知识库', confidence: 'high' }
  }
  return { answer: '灵山胜境位于江苏省无锡市太湖西北部的马山镇，是国家5A级旅游景区、世界佛教论坛永久会址。核心景点包括灵山大佛、灵山梵宫、九龙灌浴、五印坛城、祥符禅寺等。您可以询问景点详情、开放时间、门票价格、路线推荐等问题。', source: '系统推荐', confidence: 'medium' }
}

export function getMockRagResult(query: string): RagQueryResult {
  const matched = QA_MAP[Object.keys(QA_MAP).find(k => query.includes(k)) || '']
  if (matched) {
    return { answerable: true, answer: matched, contexts: [{ text: matched.substring(0, 200), score: 0.85, source: '知识库（内置演示）', domain: 'guide' }], citations: [matched.substring(0, 200)], fallback: null, latencyMs: 0 }
  }
  return { answerable: false, answer: '', contexts: [], citations: [], fallback: { reason: 'low_score', message: '暂时未能找到精确匹配' }, latencyMs: 0 }
}

// ── 管理后台数据 ───────────────────────────────────────────────────

export const MOCK_ADMIN_USER: AdminUser = { id: 'admin-1', username: 'admin', displayName: '管理员', roleId: 'superadmin' }

export const MOCK_OVERVIEW: OverviewData = {
  activeVisitors: 3247, totalSpots: 10, pendingWorkOrders: 5, pendingEmergencies: 1, avgRating: 4.7,
}

export const MOCK_SPOT_HEAT: SpotHeatData = {
  items: [
    { id: 'LS-011', name: '灵山大佛', activeVisitors: 856 },
    { id: 'LS-012', name: '灵山梵宫', activeVisitors: 623 },
    { id: 'LS-013', name: '九龙灌浴', activeVisitors: 512 },
    { id: 'LS-014', name: '五印坛城', activeVisitors: 389 },
    { id: 'LS-015', name: '祥符禅寺', activeVisitors: 345 },
    { id: 'LS-016', name: '佛手广场', activeVisitors: 278 },
    { id: 'LS-017', name: '百子戏弥勒', activeVisitors: 198 },
    { id: 'LS-018', name: '降魔成道', activeVisitors: 46 },
  ],
  totalActive: 3247,
}

export const MOCK_CROWD_FLOW: CrowdFlowData = {
  items: [
    { hour: '06:00', count: 120 }, { hour: '07:00', count: 380 },
    { hour: '08:00', count: 850 }, { hour: '09:00', count: 1560 },
    { hour: '10:00', count: 2300 }, { hour: '11:00', count: 2850 },
    { hour: '12:00', count: 2600 }, { hour: '13:00', count: 2400 },
    { hour: '14:00', count: 2100 }, { hour: '15:00', count: 1800 },
    { hour: '16:00', count: 1200 }, { hour: '17:00', count: 600 },
    { hour: '18:00', count: 200 },
  ],
}

export const MOCK_QUEUE_STATS: QueueStatsData = {
  items: [
    { spot: '灵山大佛', queueMinutes: 25, crowdLevel: 'high', activeTickets: 89 },
    { spot: '九龙灌浴', queueMinutes: 15, crowdLevel: 'medium', activeTickets: 45 },
    { spot: '灵山梵宫', queueMinutes: 30, crowdLevel: 'high', activeTickets: 102 },
    { spot: '五印坛城', queueMinutes: 5, crowdLevel: 'low', activeTickets: 12 },
    { spot: '佛手广场', queueMinutes: 8, crowdLevel: 'low', activeTickets: 20 },
    { spot: '祥符禅寺', queueMinutes: 10, crowdLevel: 'medium', activeTickets: 35 },
  ],
}

export const MOCK_COMMAND_CENTER: CommandCenterData = {
  source: 'backend_mock' as const,
  refreshIntervalSeconds: 30,
  weather: { temperatureC: 28, condition: '晴' },
  kpis: {
    todayVisitors: { total: 4800, inPark: 3247, online: 189 },
    realtimeInPark: { value: 3247, deltaPct: 12.5 },
    todayRevenue: { amount: 326800, perCapita: 100.6 },
    todaySatisfaction: { score: 4.7, goodRatePct: 94 },
    crowd: { level: '一般', loadRatePct: 65 },
  },
  monthlyVisits: [
    { month: '1月', monthEn: 'Jan', visitors: 38000, revenue: 4200000 },
    { month: '2月', monthEn: 'Feb', visitors: 25000, revenue: 2800000 },
    { month: '3月', monthEn: 'Mar', visitors: 45000, revenue: 5100000 },
    { month: '4月', monthEn: 'Apr', visitors: 52000, revenue: 5800000 },
    { month: '5月', monthEn: 'May', visitors: 58000, revenue: 6500000 },
    { month: '6月', monthEn: 'Jun', visitors: 48000, revenue: 5300000 },
    { month: '7月', monthEn: 'Jul', visitors: 62000, revenue: 6900000 },
  ],
  ageDistribution: [{ key: 'under30', value: 35 }, { key: '30to49', value: 45 }, { key: 'over50', value: 20 }],
  genderDistribution: [{ key: 'male', value: 52 }, { key: 'female', value: 48 }],
  spendingDistribution: [
    { key: 'ticket', value: 65 }, { key: 'food', value: 18 },
    { key: 'shopping', value: 10 }, { key: 'transport', value: 4 }, { key: 'entertainment', value: 3 },
  ],
  satisfactionDistribution: [
    { stars: 5, value: 62 }, { stars: 4, value: 25 },
    { stars: 3, value: 8 }, { stars: 2, value: 3 }, { stars: 1, value: 2 },
  ],
  topSpots: [
    { name: '灵山大佛', visitors: 856, pct: 26.4 },
    { name: '灵山梵宫', visitors: 623, pct: 19.2 },
    { name: '九龙灌浴', visitors: 512, pct: 15.8 },
    { name: '五印坛城', visitors: 389, pct: 12.0 },
    { name: '祥符禅寺', visitors: 345, pct: 10.6 },
  ],
  facilities: [
    { name: '游客中心', status: 'ok', load: 62 },
    { name: '停车场', status: 'ok', load: 78 },
    { name: '洗手间-A区', status: 'ok', load: 45 },
    { name: '洗手间-B区', status: 'warn', load: 88 },
    { name: '观光车站', status: 'ok', load: 55 },
  ],
  alerts: [
    { level: 'warn', title: '梵宫洗手间排队较长', message: 'B区洗手间已达承载量88%', timeAgo: '5分钟前' },
    { level: 'info', title: '停车场车位紧张', message: '剩余车位占比22%', timeAgo: '10分钟前' },
    { level: 'info', title: '大佛区域客流较大', message: '实时在园856人', timeAgo: '15分钟前' },
  ],
  heatmapCells: Array.from({ length: 48 }, () => Math.floor(Math.random() * 100)),
}

export const MOCK_KB_STATUS: KbStatus = {
  status: 'ready', vectors: 145, provider: 'chroma',
  embeddingModel: 'BAAI/bge-small-zh-v1.5', scoreThreshold: 0.45,
  chunkSize: 256, sourcesCount: 13, qaCount: 86,
}

export const MOCK_SOURCES_PAGE: PaginatedData<SourceItem> = {
  items: [
    { name: '灵山胜境游览指南', filepath: 'rag-knowledge/ling-shan-guide.md', domain: 'guide', description: '景区概况与游览信息', tags: ['官方', '指南'], createdAt: '2026-05-20' },
    { name: '景点结构化数据集', filepath: 'rag-knowledge/scenic-spots.md', domain: 'spot_detail', description: '各景点详细介绍数据', tags: ['官方', '景点'], createdAt: '2026-05-20' },
    { name: '游客常见问题', filepath: 'rag-knowledge/faq.md', domain: 'faq', description: '游客高频问答', tags: ['FAQ'], createdAt: '2026-05-22' },
    { name: '景区新闻动态', filepath: 'rag-knowledge/news.md', domain: 'news', description: '最新活动与公告', tags: ['动态'], createdAt: '2026-05-25' },
    { name: '灵山美食指南', filepath: 'rag-knowledge/food.md', domain: 'food', description: '餐饮推荐', tags: ['餐饮'], createdAt: '2026-05-28' },
    { name: '交通指南', filepath: 'rag-knowledge/transport.md', domain: 'transport', description: '交通出行信息', tags: ['交通'], createdAt: '2026-05-28' },
    { name: '历史文化背景', filepath: 'rag-knowledge/history.md', domain: 'history', description: '灵山历史与文化', tags: ['文化'], createdAt: '2026-06-01' },
  ],
  pagination: { page: 1, page_size: 20, total: 7, total_pages: 1 },
}

export const MOCK_QA_PAGE: PaginatedData<QAItem> = {
  items: [
    { question: '灵山大佛有多高？', answer: '通高88米，含台基总高101.5米', source: '景点数据集', domain: 'spot_detail', createdAt: '2026-06-01' },
    { question: '门票多少钱？', answer: '成人票210元，学生票105元', source: '游览指南', domain: 'guide', createdAt: '2026-06-01' },
    { question: '九龙灌浴几点表演？', answer: '每日10:00、11:30、13:30、15:00', source: '游览指南', domain: 'guide', createdAt: '2026-06-01' },
    { question: '梵宫有什么好看的？', answer: '东阳木雕、琉璃巨制、星空穹顶、吉祥颂演出', source: '景点数据集', domain: 'spot_detail', createdAt: '2026-06-02' },
    { question: '怎么去灵山胜境？', answer: '火车站乘88路直达，自驾导航灵山胜境', source: '交通指南', domain: 'transport', createdAt: '2026-06-02' },
  ],
  pagination: { page: 1, page_size: 20, total: 5, total_pages: 1 },
}

export const MOCK_AVATARS: AvatarItem[] = [
  { id: 'ava-1', name: '小景（标准）', style: '标准', description: '标准数字人形象，适合日常导览', gradient: 'linear-gradient(135deg, #155d58, #2a9d8f)' },
  { id: 'ava-2', name: '小景（古风）', style: '古风', description: '传统汉服风格，适合文化景点讲解', gradient: 'linear-gradient(135deg, #827a5d, #c4a77d)' },
  { id: 'ava-3', name: '小景（简约）', style: '简约', description: '清新简约风格', gradient: 'linear-gradient(135deg, #4a90d9, #7ec8e3)' },
]

export const MOCK_VOICES: VoiceItem[] = [
  { id: 'voice-1', name: '晓晓（女声）', desc: '温柔女声，普通话标准' },
  { id: 'voice-2', name: '云扬（男声）', desc: '沉稳男声，适合讲解' },
]

export const MOCK_WORK_ORDERS_PAGE: PaginatedData<WorkOrder> = {
  items: [
    { id: 'WO-001', sessionId: 's1', category: 'complaint' as const, description: '景区卫生问题', location: '梵宫出口', contact: '138****5678', status: 'pending' as const, handler: null, resolution: null, createdAt: '2026-07-16T09:30:00Z', updatedAt: '2026-07-16T09:30:00Z' },
    { id: 'WO-002', sessionId: 's2', category: 'suggestion' as const, description: '建议在大佛排队区增加休息座椅', location: '灵山大佛', contact: '139****9012', status: 'pending' as const, handler: null, resolution: null, createdAt: '2026-07-16T10:15:00Z', updatedAt: '2026-07-16T10:15:00Z' },
    { id: 'WO-003', sessionId: 's3', category: 'complaint' as const, description: '景区内餐饮价格偏高，建议设置平价窗口', location: '景区餐饮区', contact: '137****3456', status: 'processing' as const, handler: '运营组', resolution: null, createdAt: '2026-07-15T14:20:00Z', updatedAt: '2026-07-16T08:00:00Z' },
    { id: 'WO-004', sessionId: 's4', category: 'repair' as const, description: '梵宫一层洗手间3号水龙头漏水', location: '梵宫一层洗手间', contact: '内线8012', status: 'processing' as const, handler: '技术组', resolution: null, createdAt: '2026-07-15T11:00:00Z', updatedAt: '2026-07-15T16:30:00Z' },
    { id: 'WO-005', sessionId: 's5', category: 'complaint' as const, description: '九龙灌浴前往梵宫的指引牌不明显', location: '九龙灌浴', contact: '136****7890', status: 'resolved' as const, handler: '运营组', resolution: '已增加临时指引牌', createdAt: '2026-07-14T09:00:00Z', updatedAt: '2026-07-15T10:00:00Z' },
    { id: 'WO-006', sessionId: 's6', category: 'repair' as const, description: '佛手广场区域广播有杂音', location: '佛手广场', contact: '内线8001', status: 'resolved' as const, handler: '技术组', resolution: '已修复音频线路', createdAt: '2026-07-13T08:30:00Z', updatedAt: '2026-07-14T11:00:00Z' },
  ],
  pagination: { page: 1, page_size: 20, total: 6, total_pages: 1 },
}

export const MOCK_EMERGENCIES_PAGE: PaginatedData<Emergency> = {
  items: [
    { id: 'EM-001', sessionId: 'e1', emergencyType: 'medical' as const, location: '灵山大佛登云道', contact: '139****1122', description: '游客在登云道中段晕倒，需医疗支援', status: 'dispatching' as const, dispatcher: '值班经理', resolvedAt: null, createdAt: '2026-07-16T11:20:00Z', updatedAt: '2026-07-16T11:20:00Z' },
  ],
  pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 },
}

export const MOCK_FEEDBACKS_PAGE: PaginatedData<Feedback> = {
  items: [
    { id: 'FB-001', sessionId: 'f1', messageId: null, rating: 5, resolved: false, comment: '非常好的游览体验，数字人讲解很生动！', createdAt: '2026-07-16T10:30:00Z' },
    { id: 'FB-002', sessionId: 'f2', messageId: null, rating: 4, resolved: false, comment: '路线推荐很实用，节省了很多时间。', createdAt: '2026-07-16T09:15:00Z' },
    { id: 'FB-003', sessionId: 'f3', messageId: null, rating: 5, resolved: false, comment: '拍照识景功能很酷，孩子特别喜欢。', createdAt: '2026-07-15T16:45:00Z' },
    { id: 'FB-004', sessionId: 'f4', messageId: null, rating: 3, resolved: false, comment: '语音识别有时候不太准确。', createdAt: '2026-07-15T14:30:00Z' },
  ],
  pagination: { page: 1, page_size: 20, total: 4, total_pages: 1 },
}

export const MOCK_REVIEWS: { items: ReviewItem[] } = {
  items: [
    { id: 'RV-001', question: '灵山大佛值得去吗？', answer: '非常震撼，88米高青铜立像', source: '美团', spot: '灵山大佛', submittedAt: '2026-07-15', status: 'approved' as const, reviewer: '审核员A', reviewedAt: '2026-07-15' },
    { id: 'RV-002', question: '梵宫门票包含吗？', answer: '包含在景区大门票内', source: '携程', spot: '灵山梵宫', submittedAt: '2026-07-14', status: 'approved' as const, reviewer: '审核员A', reviewedAt: '2026-07-14' },
    { id: 'RV-003', question: '九龙灌浴表演时间？', answer: '10:00、11:30、13:30、15:00', source: '抖音', spot: '九龙灌浴', submittedAt: '2026-07-14', status: 'approved' as const, reviewer: '审核员B', reviewedAt: '2026-07-14' },
    { id: 'RV-004', question: '适合带老人去吗？', answer: '适合，有观光车和无障碍通道', source: '美团', spot: '景区入口', submittedAt: '2026-07-13', status: 'pending' as const },
  ],
}

export const MOCK_CONFIG_ITEMS: ConfigItem[] = [
  { key: 'scenic_name', value: '灵山胜境', description: '景区名称', updatedAt: '2026-06-01' },
  { key: 'max_queue_minutes', value: '30', description: '排队上限（分钟）', updatedAt: '2026-06-01' },
  { key: 'emergency_contact', value: '0510-85681199', description: '应急联系电话', updatedAt: '2026-06-01' },
  { key: 'auto_broadcast_interval', value: '30', description: '自动广播间隔（分钟）', updatedAt: '2026-06-05' },
  { key: 'maintenance_mode', value: 'false', description: '维护模式', updatedAt: '2026-06-10' },
]

export const MOCK_RUNTIME_STATUS: RuntimeStatus = {
  fayOnline: true, digitalHumanConnected: true, mcpOnline: true,
  ttsOnline: true, speaking: false, queueLength: 0, lastError: null,
}
