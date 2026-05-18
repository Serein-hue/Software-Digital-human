export type Status = 'green' | 'amber' | 'red'

export const summaryMetrics = [
  { label: '交付周期', value: '4W', detail: '按冲刺赛程重排 MVP 范围' },
  { label: 'PRD 模块', value: '4', detail: '交互、内容、形象、数据' },
  { label: '资料来源', value: '12+', detail: 'Word + ao-output + Agent 分析' },
  { label: '答辩主线', value: '2', detail: '前台导览 + 后台运营脑' },
]

export const evidenceSources = [
  {
    id: 'trend',
    title: '趋势研究',
    file: 'ao-output/.../steps/1-trend_research.md',
    summary: '政策窗口、智慧文旅、AI 数字人市场和 6-18 个月趋势判断。',
    usedFor: ['行业背景', '机会判断', '答辩价值叙事'],
  },
  {
    id: 'user',
    title: '用户研究',
    file: 'ao-output/.../steps/2-user_research.md',
    summary: 'C 端游客、B 端景区运营、G 端文旅主管的画像、旅程和痛点排序。',
    usedFor: ['目标用户', '用户旅程', '功能优先级'],
  },
  {
    id: 'competitor',
    title: '竞品分析',
    file: 'ao-output/.../steps/3-competitor_analysis.md',
    summary: '传统导览、AI 数字人、文旅大模型和国际标杆的能力矩阵。',
    usedFor: ['差异化定位', '竞品空白', 'Slogan'],
  },
  {
    id: 'tech',
    title: '技术可行性',
    file: 'ao-output/.../steps/4-tech_feasibility.md',
    summary: 'ASR/TTS、RAG、数字人、知识库、推荐、大屏和部署方案的可行性。',
    usedFor: ['技术红黄绿', '风险识别', '工作量评估'],
  },
  {
    id: 'research',
    title: '产品调研报告',
    file: 'ao-output/.../steps/5-research_report.md',
    summary: '执行摘要、项目背景、市场机会、目标用户、SWOT 和商业价值。',
    usedFor: ['PRD 总论', '答辩开场', '商业与社会价值'],
  },
  {
    id: 'interaction',
    title: '前端交互 PRD',
    file: 'ao-output/.../steps/6-prd_interaction.md',
    summary: '多模态输入、智能问答、LBS 讲解、唤醒/打断、异常边界和验收。',
    usedFor: ['A5-FE-01', 'C 端主链路', '交互验收'],
  },
  {
    id: 'content',
    title: '内容引擎 PRD',
    file: 'ao-output/.../steps/7-prd_content_engine.md',
    summary: '个性化推荐、知识库管理、知识图谱、审核流和内容版本管理。',
    usedFor: ['A5-CE-01', 'RAG 方案', '后台工作流'],
  },
  {
    id: 'avatar',
    title: '数字人形象 PRD',
    file: 'ao-output/.../steps/8-prd_digital_human.md',
    summary: '形象库、文化主题、表情动作、口型同步、场景匹配和 B 端管理。',
    usedFor: ['A5-AV-01', '文化 IP', '展示亮点'],
  },
  {
    id: 'analytics',
    title: '数据运营 PRD',
    file: 'ao-output/.../steps/9-prd_analytics.md',
    summary: '游客感受度报告、数据大屏、预警机制、合规与运营建议。',
    usedFor: ['A5-DA-01', 'B 端价值', '指标体系'],
  },
  {
    id: 'final',
    title: '最终交付稿',
    file: 'ao-output/.../steps/10-final_delivery.md',
    summary: '调研报告和 PRD V1.0 的合并稿，是本次文档补齐的主参考。',
    usedFor: ['完整 PRD', '附录术语', '里程碑与风险'],
  },
  {
    id: 'word',
    title: 'Word 调研报告',
    file: 'AI数字人导游_调研分析报告.docx',
    summary: '原始调研报告，包含政策背景、市场规模、竞品案例和开源技术栈。',
    usedFor: ['原始证据', '竞品案例', '技术选型'],
  },
]

export const decisions = [
  { status: 'green' as Status, title: '4 周内必须可演示', text: '主链路压缩为扫码进入、问答讲解、数字人播报、后台入库、数据回流。' },
  { status: 'amber' as Status, title: '做“可解释”的增强', text: '拍照识景、方言、多语种和推荐作为可切换演示模块，必须有降级策略。' },
  { status: 'red' as Status, title: '砍掉重硬件与平台化', text: '票务、社交、VR/全息、全身 3D、自研大模型全部退出 4 周范围。' },
]

export const fourWeekPlan = [
  {
    week: '第 1 周',
    title: '锁定范围 + 跑通主链路',
    goals: ['PRD 冻结', '单景区知识库种子语料', '文本问答 + RAG 信源', '基础页面原型'],
    demo: '游客输入问题，系统基于景区知识库回答并展示信源。',
  },
  {
    week: '第 2 周',
    title: '语音与数字人联调',
    goals: ['ASR/TTS 接入', '数字人口型/表情演示', 'LBS 模拟触发', '弱网降级雏形'],
    demo: '走近景点后自动触发讲解，支持语音追问和字幕。',
  },
  {
    week: '第 3 周',
    title: '后台与数据闭环',
    goals: ['知识库上传审核', '数字人形象配置', '热门问题统计', '感受度报告'],
    demo: '运营人员上传资料，游客使用后大屏实时出现问题和满意度。',
  },
  {
    week: '第 4 周',
    title: '压测打磨 + 答辩材料',
    goals: ['指标验证', '风险兜底', '演示脚本', '技术白皮书和 PRD 归档'],
    demo: '完整答辩路径：C 端体验、B 端运营、G 端合规一镜到底。',
  },
]

export const modules = [
  {
    code: 'A5-FE-01',
    name: '前端交互',
    route: 'interaction',
    value: '游客与 AI 数字人的第一触点，把复杂 AI 能力变成自然导览体验。',
    p0: ['扫码进入', '语音/文本输入', 'LBS 主动讲解', '分层讲解', '弱网降级'],
    p1: ['拍照识景', '方言/多语种', 'H5 文化足迹'],
    stories: ['作为亲子家庭，我希望讲解能切换儿童版。', '作为银发游客，我希望大字幕和语音优先。', '作为 Z 世代，我希望游后能生成可分享卡片。'],
    acceptance: ['端到端响应 P95 <= 5s，冲刺目标 <= 1.5s', '普通话 ASR >= 95%', 'LBS 误差 <= 5m'],
  },
  {
    code: 'A5-CE-01',
    name: '内容引擎',
    route: 'content',
    value: 'AI 数字人的大脑与记忆，让景区资料变成可审计、可复用、可热更新的知识资产。',
    p0: ['Word/PDF 上传', 'OCR/解析', 'RAG 检索', '信源标注', '内容审核'],
    p1: ['知识图谱', '路线推荐', '版本回滚'],
    stories: ['作为运营人员，我希望新展资料上传后快速上线。', '作为游客，我希望回答不是编的，能看到依据。', '作为内容负责人，我希望错误内容能回滚。'],
    acceptance: ['Recall@5 >= 85%', 'RAG 幻觉率 <= 5%', '信源覆盖 100%'],
  },
  {
    code: 'A5-AV-01',
    name: '数字人形象',
    route: 'avatar',
    value: '景区文化 IP 的人格化入口，提供陪伴感、记忆点和答辩展示张力。',
    p0: ['通用形象库', '文化主题形象', '口型同步', '基础表情动作', 'B 端上下架'],
    p1: ['景点自动匹配', '自定义 IP', 'A/B 测试'],
    stories: ['作为游客，我希望数字人符合当前景点文化气质。', '作为景区，我希望上传素材生成专属 IP。', '作为评审，我希望看到形象驱动不是静态图片。'],
    acceptance: ['渲染帧率 >= 30fps', '唇形同步 < 200ms', '用户喜爱度 >= 4.2/5'],
  },
  {
    code: 'A5-DA-01',
    name: '数据运营',
    route: 'analytics',
    value: '把游客真实感受翻译成景区可执行的运营动作，解决管理盲区。',
    p0: ['实时在线', '热门问题', '满意度趋势', '游客感受度报告', '数据大屏'],
    p1: ['低停留点识别', '负面情绪预警', '运营建议'],
    stories: ['作为运营经理，我希望知道游客今天最常问什么。', '作为文旅主管，我希望导出文化传播和安全治理证据。', '作为游客，我希望游后收到个人文化足迹。'],
    acceptance: ['大屏刷新 P95 <= 3s', '报告生成 <= 8s', 'H5 分享转化 >= 15%'],
  },
]

export const kpiData = [
  { name: '问答准确率', target: 90, sprint: 82 },
  { name: '信源覆盖', target: 100, sprint: 100 },
  { name: 'ASR 准确率', target: 95, sprint: 90 },
  { name: '推荐 CTR', target: 18, sprint: 12 },
  { name: '分享转化', target: 15, sprint: 8 },
]

export const riskData = [
  { name: '幻觉', value: 85 },
  { name: '延迟', value: 78 },
  { name: '语料', value: 90 },
  { name: '合规', value: 74 },
  { name: '范围', value: 88 },
]

export const competitorGaps = [
  { axis: '传统导览', gap: '覆盖有余，互动不足', chance: '用 RAG、多轮追问、分层讲解拉开体验差距。' },
  { axis: 'AI 数字人平台', gap: '形象强，景区闭环弱', chance: '绑定 LBS、景区知识库和运营数据。' },
  { axis: '文旅大模型', gap: '问答强，前台体验弱', chance: '加入数字人播报、H5 入口和 B 端后台。' },
  { axis: '国际标杆', gap: '内容强，本地合规弱', chance: '突出方言、无障碍、政务合规和中小景区普惠。' },
]

export const techMatrix = [
  { status: 'green' as Status, title: '绿灯能力', items: ['RAG 问答', '知识库后台', 'ASR/TTS', 'ECharts/Recharts 大屏', '标签推荐'] },
  { status: 'amber' as Status, title: '黄灯攻关', items: ['P95 延迟', '方言识别', '口型同步', '拍照识景', '弱网三级降级'] },
  { status: 'red' as Status, title: '红灯边界', items: ['全身实时 3D', '全息投影', '自研基座模型', '票务支付', '跨景区账号'] },
]

export const risks = [
  { name: 'RAG 幻觉', probability: '中', impact: '高', response: '信源标注、限定回答、人工审核高风险内容。' },
  { name: '端到端延迟', probability: '中', impact: '高', response: '流式链路、热门讲解缓存、文本优先降级。' },
  { name: '试点语料不足', probability: '高', impact: '高', response: '公开资料兜底，先做单景区闭环，素材缺口透明展示。' },
  { name: '合规争议', probability: '中', impact: '高', response: '显式授权、默认关闭敏感采集、数据本地化部署。' },
  { name: '范围蔓延', probability: '中', impact: '高', response: '4 周只保主链路和可解释增强，其他进入 Won’t Have。' },
]

export const agentRoles = [
  '产品经理：范围、MVP、验收指标',
  'UX/UI 设计师：多页面信息架构、动效和可读性',
  '软件架构师：Vite、HashRouter、GitHub Pages 发布路径',
  'AI 技术架构师：RAG/ASR/TTS/数字人可行性',
  '数据运营产品经理：大屏、感受度报告、指标体系',
  '内容引擎产品经理：知识库、审核流、推荐闭环',
  '数字人产品经理：形象库、口型同步与文化 IP',
]
