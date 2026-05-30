import summaryMarkdown from '../content/ao-output__景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00__summary.md?raw'
import trendMarkdown from '../content/ao-output__景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00__steps__1-trend_research.md?raw'
import userResearchMarkdown from '../content/ao-output__景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00__steps__2-user_research.md?raw'
import competitorMarkdown from '../content/ao-output__景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00__steps__3-competitor_analysis.md?raw'
import techMarkdown from '../content/ao-output__景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00__steps__4-tech_feasibility.md?raw'
import reportMarkdown from '../content/ao-output__景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00__steps__5-research_report.md?raw'
import interactionMarkdown from '../content/ao-output__景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00__steps__6-prd_interaction.md?raw'
import contentMarkdown from '../content/ao-output__景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00__steps__7-prd_content_engine.md?raw'
import avatarMarkdown from '../content/ao-output__景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00__steps__8-prd_digital_human.md?raw'
import analyticsMarkdown from '../content/ao-output__景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00__steps__9-prd_analytics.md?raw'
import finalMarkdown from '../content/ao-output__景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00__steps__10-final_delivery.md?raw'
import prdMarkdown from '../content/prd-a5-ai-digital-human.md?raw'
import convertedWordMarkdown from '../content/docs__index.md?raw'

export type SourceDoc = {
  id: string
  title: string
  role: string
  file: string
  summary: string
  focus: string[]
  content: string
}

export type PriorityBlock = {
  code: string
  title: string
  summary: string
  mustHave: string[]
  shouldHave: string[]
  outOfScope: string[]
}

export type CompetitorRow = {
  name: string
  type: string
  interaction: string
  knowledge: string
  avatar: string
  analytics: string
  note: string
}

export type MetricRule = {
  metric: string
  pass: string
  target: string
  fail: string
  evidence: string
}

export type RoadmapWeek = {
  week: string
  title: string
  deliverables: string[]
  checkpoint: string
}

export type FlowStage = {
  id: string
  title: string
  detail: string
  note: string
}

export const navRoutes = [
  { to: '/guide', label: 'C端导览' },
  { to: '/dashboard', label: '数据大屏' },
  { to: '/knowledge', label: '知识库' },
  { to: '/review', label: '内容审核' },
  { to: '/', label: '总览' },
  { to: '/prd', label: 'PRD' },
  { to: '/library', label: '资料库' },
  { to: '/competitors', label: '竞品' },
  { to: '/timeline', label: '4周节奏' },
  { to: '/validation', label: '指标与验证' },
]

export const heroBullets = [
  '4周只交付可演示、可解释、可验收的主链路',
  '把 ao-output 的内容全部编入资料库，点开即可阅读原文',
  '把 PRD 重点、竞品结论、评分标准分开呈现',
]

export const priorityBlocks: PriorityBlock[] = [
  {
    code: 'A5-FE-01',
    title: '前端交互',
    summary: '这是游客第一次接触产品的地方，只做主链路，不做通用平台。',
    mustHave: [
      '扫码 / 语音 / 文本三种入口至少保住两种',
      '问答结果要能看到来源，不接受黑盒回答',
      '多轮对话要保持上下文，不要每次都重新开始',
      '弱网场景要能降级，别把游客留在空白页',
    ],
    shouldHave: [
      '方言与多语种',
      '拍照识景',
      '移动端自适应',
    ],
    outOfScope: [
      '票务、支付、会员体系',
      '泛旅游平台能力',
    ],
  },
  {
    code: 'A5-CE-01',
    title: '内容引擎',
    summary: '负责把景区资料变成可检索、可更新、可追溯的知识库。',
    mustHave: [
      'Word / PDF / 图片资料可入库',
      'OCR、切分、向量化、检索、引用链路完整',
      '内容更新后能看到版本变化',
      '审核后再对外回答，避免错讲',
    ],
    shouldHave: [
      '知识图谱',
      '推荐线路',
      '版本回滚',
    ],
    outOfScope: [
      '自建基础大模型',
      '超大规模企业知识平台',
    ],
  },
  {
    code: 'A5-AV-01',
    title: '数字人形象',
    summary: '用低成本方式做出有记忆点的景区讲解形象，不追求全身实时 3D。',
    mustHave: [
      '通用形象库',
      '文化主题形象',
      '口型同步',
      '基础表情与动作',
    ],
    shouldHave: [
      '景点自动适配',
      'IP 自定义',
      'A/B 测试',
    ],
    outOfScope: [
      '全身实时 3D 渲染',
      '高算力沉浸式 VR 方案',
    ],
  },
  {
    code: 'A5-DA-01',
    title: '数据运营',
    summary: '把游客行为沉淀为景区运营动作，不只看热闹，也要能落地。',
    mustHave: [
      '服务人次、热门问题、满意度趋势',
      '情感反馈与关注点统计',
      '数据大屏',
      '周报 / 月报自动生成',
    ],
    shouldHave: [
      '低停留点识别',
      '高频负面反馈聚类',
      '运营建议',
    ],
    outOfScope: [
      '复杂商业智能平台',
      '跨景区统一经营中台',
    ],
  },
]

export const flowStages: FlowStage[] = [
  {
    id: 'intake',
    title: '游客提问',
    detail: '扫码、语音、文本输入',
    note: '入口尽量少，动作尽量直。',
  },
  {
    id: 'retrieve',
    title: '检索知识库',
    detail: '景点资料、规则说明、路线推荐',
    note: '先找证据，再组织回答。',
  },
  {
    id: 'generate',
    title: '生成回答',
    detail: '大模型根据检索内容组装回答',
    note: '控制长度、引用来源、避免编造。',
  },
  {
    id: 'speak',
    title: '语音播报',
    detail: 'TTS 支持普通话 / 多语种 / 方言',
    note: '语速、停顿、情绪要可控。',
  },
  {
    id: 'avatar',
    title: '数字人出镜',
    detail: '口型、表情、姿态同步输出',
    note: '形象只负责承载，不抢内容。',
  },
  {
    id: 'ops',
    title: '运营回流',
    detail: '热问、停留、满意度、分享率',
    note: '数据回流给内容和运营。',
  },
]

export const sourceDocs: SourceDoc[] = [
  {
    id: 'summary',
    title: '工作流总览',
    role: '总入口',
    file: 'ao-output/…/summary.md',
    summary: '10 个步骤的完整产出总览，适合作为资料库入口。',
    focus: ['总览', '产物结构', '交付范围'],
    content: summaryMarkdown,
  },
  {
    id: 'trend',
    title: '趋势研究',
    role: '背景材料',
    file: 'ao-output/…/steps/1-trend_research.md',
    summary: '政策窗口、市场规模、行业痛点和技术成熟度。',
    focus: ['政策', '市场', '落地场景'],
    content: trendMarkdown,
  },
  {
    id: 'users',
    title: '用户研究',
    role: '背景材料',
    file: 'ao-output/…/steps/2-user_research.md',
    summary: '亲子、银发、Z 世代、文史爱好者和景区管理者的核心诉求。',
    focus: ['用户画像', '场景', '需求优先级'],
    content: userResearchMarkdown,
  },
  {
    id: 'competitors',
    title: '竞品分析原文',
    role: '背景材料',
    file: 'ao-output/…/steps/3-competitor_analysis.md',
    summary: '把市场头部案例和平台级竞品拉到一张表里。',
    focus: ['竞品矩阵', '差异化机会', '空白区'],
    content: competitorMarkdown,
  },
  {
    id: 'tech',
    title: '技术可行性',
    role: '背景材料',
    file: 'ao-output/…/steps/4-tech_feasibility.md',
    summary: 'ASR、TTS、RAG、数字人和大屏方案的选型依据。',
    focus: ['技术选型', '风险', '工作量'],
    content: techMarkdown,
  },
  {
    id: 'report',
    title: '调研报告',
    role: '总论',
    file: 'ao-output/…/steps/5-research_report.md',
    summary: '项目摘要、立项依据、商业判断与技术判断。',
    focus: ['结论', '立项', '范围判断'],
    content: reportMarkdown,
  },
  {
    id: 'interaction',
    title: '前端交互 PRD',
    role: 'PRD 重点',
    file: 'ao-output/…/steps/6-prd_interaction.md',
    summary: '游客侧唯一入口，决定第一印象和主链路体验。',
    focus: ['入口', '对话', '交互反馈'],
    content: interactionMarkdown,
  },
  {
    id: 'content',
    title: '内容引擎 PRD',
    role: 'PRD 重点',
    file: 'ao-output/…/steps/7-prd_content_engine.md',
    summary: '知识库管理、审核、版本、推荐线路。',
    focus: ['入库', '检索', '审核'],
    content: contentMarkdown,
  },
  {
    id: 'avatar',
    title: '数字人形象 PRD',
    role: 'PRD 重点',
    file: 'ao-output/…/steps/8-prd_digital_human.md',
    summary: '形象库、文化 IP、口型同步和景点适配。',
    focus: ['形象', '口型', 'IP'],
    content: avatarMarkdown,
  },
  {
    id: 'analytics',
    title: '数据运营 PRD',
    role: 'PRD 重点',
    file: 'ao-output/…/steps/9-prd_analytics.md',
    summary: '数据大屏、情感反馈、周报与运营建议。',
    focus: ['指标', '看板', '运营动作'],
    content: analyticsMarkdown,
  },
  {
    id: 'final',
    title: '最终交付',
    role: '收口文档',
    file: 'ao-output/…/steps/10-final_delivery.md',
    summary: '把调研和 PRD 合并成最终可交付稿。',
    focus: ['收口', '说明', '版本管理'],
    content: finalMarkdown,
  },
  {
    id: 'prd',
    title: '完整 PRD',
    role: '主文档',
    file: 'prd-a5-ai-digital-human.md',
    summary: '面向评审的完整产品说明书。',
    focus: ['主链路', '版本', '验收'],
    content: prdMarkdown,
  },
  {
    id: 'converted',
    title: 'Word 转 Markdown',
    role: '原始整理稿',
    file: 'docs/index.md',
    summary: '原 Word 报告整理后的 Markdown 版本，便于网页阅读与 GitHub Pages 发布。',
    focus: ['原文整理', '网页展示', '可读性'],
    content: convertedWordMarkdown,
  },
]

export const competitorRows: CompetitorRow[] = [
  {
    name: '三毛游',
    type: '导览 App',
    interaction: '弱',
    knowledge: '弱',
    avatar: '无',
    analytics: '弱',
    note: '覆盖广，但交互和闭环都不完整。',
  },
  {
    name: '氢气球',
    type: '旅行内容工具',
    interaction: '弱',
    knowledge: '弱',
    avatar: '无',
    analytics: '无',
    note: '更偏内容分发，不是景区内讲解闭环。',
  },
  {
    name: '链景旅行',
    type: '景区工具',
    interaction: '中',
    knowledge: '中',
    avatar: '无',
    analytics: '中',
    note: '有数据看板，但数字人和知识管理仍浅。',
  },
  {
    name: '景区官方小程序',
    type: '官方入口',
    interaction: '弱',
    knowledge: '无',
    avatar: '无',
    analytics: '无',
    note: '有入口，没有讲解和服务闭环。',
  },
  {
    name: '百度希加加',
    type: '数字人平台',
    interaction: '强',
    knowledge: '中',
    avatar: '强',
    analytics: '中',
    note: '强在数字人，但不是景区知识闭环产品。',
  },
  {
    name: '商汤如影',
    type: '数字人平台',
    interaction: '强',
    knowledge: '弱',
    avatar: '强',
    analytics: '弱',
    note: '形象能力强，但景区业务不是核心。',
  },
]

export const competitorTakeaways = [
  '竞品普遍强在单点，不强在闭环。',
  '真正空白的是“景区知识库 + 数字人 + 数据回流”的一体化方案。',
  '4 周版不能贪全，要把能演示、能解释、能验收的链路先做稳。',
]

export const metricRules: MetricRule[] = [
  {
    metric: '问答准确率',
    pass: '≥ 90%',
    target: '≥ 95%',
    fail: '< 85%',
    evidence: '抽检 100 条核心问答，按人工标准核对。',
  },
  {
    metric: '检索命中率',
    pass: '≥ 85%',
    target: '≥ 92%',
    fail: '< 80%',
    evidence: '看前 5 条检索结果是否命中正确资料。',
  },
  {
    metric: '端到端响应',
    pass: '≤ 5 秒',
    target: '≤ 3 秒',
    fail: '> 8 秒',
    evidence: '从用户发问到看到完整回答的总时长。',
  },
  {
    metric: '口型同步',
    pass: '≤ 200ms 偏差',
    target: '≤ 120ms 偏差',
    fail: '> 300ms 偏差',
    evidence: '看播报视频是否出现明显对不上嘴的问题。',
  },
  {
    metric: '大屏刷新',
    pass: '≤ 3 秒',
    target: '≤ 1 秒',
    fail: '> 5 秒',
    evidence: '看实时指标是否能跟上高频访问。',
  },
  {
    metric: '分享转化',
    pass: '≥ 10%',
    target: '≥ 15%',
    fail: '< 8%',
    evidence: '观察游客是否愿意把结果页转成外部传播。',
  },
]

export const roadmapWeeks: RoadmapWeek[] = [
  {
    week: '第 1 周',
    title: '锁范围，补资料',
    deliverables: ['冻结 PRD 主链路', '整理知识库样例', '补齐页面信息架构', '搭出首页和资料库原型'],
    checkpoint: '能让评审一眼看懂“做什么、不做什么”。',
  },
  {
    week: '第 2 周',
    title: '打通交互链路',
    deliverables: ['接入问答链路', '完成基础数字人播报', '让 React Flow 展示完整流程', '把 Markdown 原文接到页面里'],
    checkpoint: '游客能从问题走到答案，且能看到原文依据。',
  },
  {
    week: '第 3 周',
    title: '补竞品和指标',
    deliverables: ['把竞品表和评分标准补全', '完善指标定义', '增加数据看板示例', '做关键页面动效'],
    checkpoint: '不再只是好看，要能解释为什么这样做。',
  },
  {
    week: '第 4 周',
    title: '压测与收口',
    deliverables: ['整理演示脚本', '补验收说明', '压缩无关功能', '完成最终文档和 GitHub Pages 发布'],
    checkpoint: '材料能交、能读、能讲、能复核。',
  },
]
