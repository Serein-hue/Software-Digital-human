import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  CircleDot,
  MapPinned,
  MessageCircle,
  PlayCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import GuidePage from './components/guide/GuidePage'
import DataDashboard from './components/admin/DataDashboard'
import KnowledgeBase from './components/admin/KnowledgeBase'
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  type Edge,
  type Node,
} from '@xyflow/react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import ReactMarkdown from 'react-markdown'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import {
  HashRouter,
  NavLink,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import '@xyflow/react/dist/style.css'
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'
import {
  competitorRows,
  competitorTakeaways,
  flowStages,
  heroBullets,
  metricRules,
  navRoutes,
  priorityBlocks,
  roadmapWeeks,
  sourceDocs,
} from './data/siteData'

type StageNodeData = {
  title: string
  detail: string
  note: string
}

const chartData = [
  { name: '问答', sprint: 82, target: 90 },
  { name: '检索', sprint: 84, target: 92 },
  { name: '口型', sprint: 76, target: 88 },
  { name: '大屏', sprint: 70, target: 85 },
  { name: '分享', sprint: 8, target: 15 },
]

const stageNodes: Node<StageNodeData>[] = flowStages.map((stage, index) => ({
  id: stage.id,
  type: 'stage',
  position: { x: index * 260, y: index % 2 === 0 ? 20 : 150 },
  data: {
    title: stage.title,
    detail: stage.detail,
    note: stage.note,
  },
}))

const stageEdges: Edge[] = flowStages.slice(0, -1).map((stage, index) => ({
  id: `${stage.id}-${flowStages[index + 1].id}`,
  source: stage.id,
  target: flowStages[index + 1].id,
  animated: true,
  style: { stroke: '#155d58', strokeWidth: 1.5 },
}))

function StageNode({ data }: Readonly<{ data: StageNodeData }>) {
  return (
    <div className="flow-node">
      <Handle type="target" position={Position.Left} />
      <span>{data.title}</span>
      <strong>{data.detail}</strong>
      <small>{data.note}</small>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

function PageShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        className="page-shell"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  )
}

function Header() {
  return (
    <header className="app-header">
      <NavLink className="brand" to="/">
        <Sparkles size={18} />
        <span>景区导览 AI 数字人</span>
      </NavLink>
      <nav className="route-nav" aria-label="主导航">
        {navRoutes.map((route) => (
          <NavLink key={route.to} to={route.to} end={route.to === '/'}>
            <span>{route.label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

function MetricStrip() {
  return (
    <section className="metric-strip">
      {[
        { label: '交付窗口', value: '4 周', detail: '只保主链路' },
        { label: '资料来源', value: '10+1', detail: 'ao-output + PRD' },
        { label: '重点模块', value: '4 个', detail: '交互 / 内容 / 形象 / 数据' },
        { label: '路径目标', value: '1 条', detail: '可演示闭环' },
      ].map((item) => (
        <article key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <em>{item.detail}</em>
        </article>
      ))}
    </section>
  )
}

function OverviewPage() {
  const orbitRef = useRef<HTMLDivElement | null>(null)

  useGSAP(
    () => {
      if (!orbitRef.current) return
      const ctx = gsap.context(() => {
        gsap.to('.orbit-chip', {
          y: -8,
          duration: 2.8,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          stagger: 0.18,
        })
      }, orbitRef)
      return () => ctx.revert()
    },
    { scope: orbitRef },
  )

  return (
    <PageShell>
      <section className="hero-shell">
        <div className="hero-copy">
          <p className="eyebrow">中国软件杯 2026 A5 · 4 周版</p>
          <h1>文档中心</h1>
          <p className="lead">
            资料汇总。
          </p>
          <div className="hero-actions">
            <NavLink to="/library" className="action-button">
              <BookOpen size={16} />
              <span>资料库</span>
            </NavLink>
            <NavLink to="/validation" className="action-button secondary">
              <ShieldCheck size={16} />
              <span>指标标准</span>
            </NavLink>
          </div>
          <div className="bullet-list">
            {heroBullets.map((bullet) => (
              <div key={bullet} className="bullet-item">
                <CircleDot size={14} />
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-panel" ref={orbitRef}>
          <div className="hero-panel-top">
            <span>闭环链路</span>
            <strong>游客输入</strong>
          </div>
          <div className="orbit-stage">
            {['扫码', '问答', '播报', '回流'].map((item) => (
              <span key={item} className="orbit-chip">
                {item}
              </span>
            ))}
          </div>
          <div className="hero-panel-bottom">
            <span>4 周内只做一条完整演示路径</span>
            <strong>入口 - 检索 - 生成 - 播报 - 回流</strong>
          </div>
        </div>
      </section>

      <MetricStrip />

      <section className="section split">
        <div className="section-heading">
          <p className="eyebrow">主链路</p>
          <h2>先做完整路径，再补增强项</h2>
          <p>主链路是游客能否顺畅理解产品的关键，增强项只有在主链路稳定后才有价值。</p>
        </div>
        <div className="chart-card">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ded8c9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sprint" stroke="#b4522c" strokeWidth={2} dot />
              <Line type="monotone" dataKey="target" stroke="#155d58" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">流程链路</p>
          <h2>流程编排</h2>
          <p>把游客输入、知识库、生成、播报、数字人和运营回流串成闭环，不再靠一堆段落解释。</p>
        </div>
        <div className="flow-canvas">
          <ReactFlow
            nodes={stageNodes}
            edges={stageEdges}
            nodeTypes={{ stage: StageNode }}
            fitView
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={false}
            zoomOnScroll={false}
          >
            <Background gap={18} color="#d9d2c1" />
          </ReactFlow>
        </div>
      </section>
    </PageShell>
  )
}

function PrdPage() {
  return (
    <PageShell>
      <section className="section">
        <div className="section-heading wide">
          <p className="eyebrow">PRD 重点</p>
          <h1>先看重点，再看扩展，不把附录和核心混在一起</h1>
          <p>这里把四个主模块拆开，每个模块都能对应到具体的评审问题、验收结果和风险边界。</p>
        </div>
        <div className="priority-grid">
          {priorityBlocks.map((block) => (
            <article key={block.code} className="priority-card">
              <div className="priority-head">
                <span>{block.code}</span>
                <h2>{block.title}</h2>
              </div>
              <p>{block.summary}</p>
              <div className="priority-columns">
                <div>
                  <h3>必须做</h3>
                  <ul>{block.mustHave.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div>
                  <h3>可以增强</h3>
                  <ul>{block.shouldHave.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              </div>
              <div className="scope-box">
                <strong>不做</strong>
                <ul>{block.outOfScope.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  )
}

function LibraryPage() {
  const [activeId, setActiveId] = useState(sourceDocs[0].id)
  const activeDoc = useMemo(
    () => sourceDocs.find((doc) => doc.id === activeId) ?? sourceDocs[0],
    [activeId],
  )

  return (
    <PageShell>
      <section className="section library-layout">
        <div className="section-heading">
          <p className="eyebrow">资料库</p>
          <h1>点击标题，直接看原文 Markdown</h1>
          <p>这里不做二次转述。左边是资料索引，右边是原文阅读器，所有 ao-output 内容都在这里找到。</p>
        </div>
        <div className="library-grid">
          <aside className="library-list">
            {sourceDocs.map((doc) => (
              <button
                key={doc.id}
                type="button"
                className={doc.id === activeId ? 'doc-item active' : 'doc-item'}
                onClick={() => setActiveId(doc.id)}
              >
                <span>{doc.role}</span>
                <strong>{doc.title}</strong>
                <p>{doc.summary}</p>
                <em>{doc.file}</em>
              </button>
            ))}
          </aside>
          <article className="reader-shell">
            <div className="reader-head">
              <div>
                <span>{activeDoc.role}</span>
                <h2>{activeDoc.title}</h2>
              </div>
              <div className="reader-tags">
                {activeDoc.focus.map((item) => <em key={item}>{item}</em>)}
              </div>
            </div>
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
                {activeDoc.content}
              </ReactMarkdown>
            </div>
          </article>
        </div>
      </section>
    </PageShell>
  )
}

function CompetitorsPage() {
  return (
    <PageShell>
      <section className="section">
        <div className="section-heading wide">
          <p className="eyebrow">竞品分析</p>
          <h1>把竞品摆上台面，才知道我们为什么只做这四件事</h1>
          <p>这里直接给出市场案例和平台级竞品的对比，核心不是谁名气大，而是谁真的补上了我们的空白。</p>
        </div>
        <div className="competitor-grid">
          {competitorRows.map((row) => (
            <article key={row.name} className="competitor-card">
              <div className="competitor-head">
                <strong>{row.name}</strong>
                <span>{row.type}</span>
              </div>
              <dl>
                <div><dt>交互</dt><dd>{row.interaction}</dd></div>
                <div><dt>知识库</dt><dd>{row.knowledge}</dd></div>
                <div><dt>形象</dt><dd>{row.avatar}</dd></div>
                <div><dt>运营</dt><dd>{row.analytics}</dd></div>
              </dl>
              <p>{row.note}</p>
            </article>
          ))}
        </div>
        <div className="takeaway-panel">
          <h2>结论</h2>
          <ul>
            {competitorTakeaways.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>
    </PageShell>
  )
}

function TimelinePage() {
  return (
    <PageShell>
      <section className="section">
        <div className="section-heading wide">
          <p className="eyebrow">4 周节奏</p>
          <h1>压缩交付，不压缩解释</h1>
          <p>4 周不是让你砍内容，而是让你只保留真正能形成闭环、能演示、能验收的部分。</p>
        </div>
        <div className="timeline-grid">
          {roadmapWeeks.map((week, index) => (
            <motion.article
              key={week.week}
              className="timeline-card"
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <span>{week.week}</span>
              <h2>{week.title}</h2>
              <ul>{week.deliverables.map((item) => <li key={item}>{item}</li>)}</ul>
              <p>{week.checkpoint}</p>
            </motion.article>
          ))}
        </div>
      </section>
    </PageShell>
  )
}

function ValidationPage() {
  const riskSlices = [
    { name: '内容质量', value: 38, fill: '#b4522c' },
    { name: '响应时延', value: 30, fill: '#155d58' },
    { name: '形象适配', value: 18, fill: '#c1a15a' },
    { name: '合规边界', value: 14, fill: '#6b7280' },
  ]

  return (
    <PageShell>
      <section className="section split">
        <div className="section-heading">
          <p className="eyebrow">指标与验证</p>
          <h1>没有评分标准，就不要画模糊图</h1>
          <p>这里把每个指标的及格线、目标线、失败线都写出来，避免“看起来不错”但无法验收。</p>
        </div>
        <div className="chart-card">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={riskSlices} dataKey="value" nameKey="name" innerRadius={54} outerRadius={96} paddingAngle={4}>
                {riskSlices.map((slice) => (
                  <Cell key={slice.name} fill={slice.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="section">
        <div className="metric-table">
          <div className="metric-row header">
            <span>指标</span>
            <span>及格线</span>
            <span>目标线</span>
            <span>失败线</span>
            <span>验证方式</span>
          </div>
          {metricRules.map((rule) => (
            <div className="metric-row" key={rule.metric}>
              <span>{rule.metric}</span>
              <span>{rule.pass}</span>
              <span>{rule.target}</span>
              <span>{rule.fail}</span>
              <span>{rule.evidence}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">评分逻辑</p>
          <h2>什么算好，什么算过线，一次讲明白</h2>
        </div>
        <div className="score-grid">
          <article>
            <h3>PRD 重点</h3>
            <ul>
              <li>能不能解释为什么只做这四个模块。</li>
              <li>能不能说清楚主链路和增强项的先后顺序。</li>
              <li>能不能看出边界在哪里。</li>
            </ul>
          </article>
          <article>
            <h3>竞品分析</h3>
            <ul>
              <li>有没有把市场头部和平台级竞品都放进去。</li>
              <li>有没有说明我们填补了什么空白。</li>
              <li>有没有和产品范围直接对应。</li>
            </ul>
          </article>
          <article>
            <h3>验证标准</h3>
            <ul>
              <li>是否定义了及格线、目标线和失败线。</li>
              <li>是否能在 4 周内用现成工具测出来。</li>
              <li>是否能支撑评审判断而不是只是装饰。</li>
            </ul>
          </article>
        </div>
      </section>
    </PageShell>
  )
}

function WordPage() {
  return (
    <PageShell>
      <section className="section">
        <div className="section-heading wide">
          <p className="eyebrow">Word 转 Markdown</p>
          <h1>原文已经整理成 Markdown，并纳入站点导航</h1>
          <p>这个页面保留原始整理稿，方便和 ao-output 的步骤文档并排查看。</p>
        </div>
        <article className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
            {sourceDocs.find((doc) => doc.id === 'converted')?.content ?? ''}
          </ReactMarkdown>
        </article>
      </section>
    </PageShell>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/prd" element={<PrdPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/competitors" element={<CompetitorsPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/dashboard" element={<DataDashboard />} />
        <Route path="/knowledge" element={<KnowledgeBase />} />
        <Route path="/validation" element={<ValidationPage />} />
        <Route path="/word" element={<WordPage />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <HashRouter>
      <Header />
      <AnimatedRoutes />
      <footer className="app-footer">
        <MapPinned size={16} />
        <span>内容来自 Word、ao-output 与 PRD，页面以 GitHub Pages 发布</span>
        <PlayCircle size={16} />
      </footer>
    </HashRouter>
  )
}

export default App
