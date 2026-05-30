import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, TrendingUp, Star, Wallet, MapPin, Clock,
  Wifi, Thermometer, CloudSun, AlertTriangle, Check,
} from 'lucide-react'
import {
  CartesianGrid, Pie, PieChart, Cell, BarChart, Bar,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
  Area, AreaChart,
} from 'recharts'

const MONTHLY_VISITS = [
  { month: '1月', 游客量: 10 }, { month: '2月', 游客量: 13 },
  { month: '3月', 游客量: 35 }, { month: '4月', 游客量: 49 },
  { month: '5月', 游客量: 54 }, { month: '6月', 游客量: 49 },
  { month: '7月', 游客量: 42 }, { month: '8月', 游客量: 68 },
  { month: '9月', 游客量: 73 }, { month: '10月', 游客量: 38 },
  { month: '11月', 游客量: 31 }, { month: '12月', 游客量: 60 },
]

const AGE_DATA = [
  { name: '30岁以下', value: 153, fill: '#15bba0' },
  { name: '30-49岁', value: 221, fill: '#155d58' },
  { name: '50岁以上', value: 148, fill: '#8ab89e' },
]

const GENDER_DATA = [
  { name: '男性', value: 275, fill: '#15bba0' },
  { name: '女性', value: 247, fill: '#c1a15a' },
]

const SATISFACTION_DATA = [
  { name: '5★', value: 8, fill: '#15bba0' },
  { name: '4★', value: 114, fill: '#155d58' },
  { name: '3★', value: 314, fill: '#c1a15a' },
  { name: '2★', value: 62, fill: '#e89460' },
  { name: '1★', value: 24, fill: '#b4522c' },
]

const SPENDING_DATA = [
  { name: '门票', value: 203, fill: '#15bba0' },
  { name: '餐饮', value: 228, fill: '#155d58' },
  { name: '购物', value: 236, fill: '#c1a15a' },
  { name: '交通', value: 48, fill: '#e89460' },
  { name: '娱乐', value: 185, fill: '#8ab89e' },
]

const TOP_SPOTS = [
  { name: '灵山大佛', visitors: 418, pct: '80.1%' },
  { name: '灵山梵宫', visitors: 385, pct: '73.8%' },
  { name: '九龙灌浴', visitors: 352, pct: '67.4%' },
  { name: '五印坛城', visitors: 296, pct: '56.7%' },
  { name: '祥符禅寺', visitors: 273, pct: '52.3%' },
]

const FACILITIES = [
  { name: '南门闸机', status: 'ok', load: 62 },
  { name: '东门闸机', status: 'ok', load: 34 },
  { name: '大佛电梯', status: 'ok', load: 78 },
  { name: '梵宫展厅', status: 'warn', load: 91 },
  { name: '停车场 A', status: 'ok', load: 45 },
  { name: '停车场 B', status: 'ok', load: 28 },
  { name: '观光车站', status: 'ok', load: 55 },
]

const VIEWS = ['overview', 'demographics', 'revenue', 'status'] as const
type View = typeof VIEWS[number]
const ROTATION_MS = 18_000

function AnimatedNumber({ value }: { value: number | string }) {
  return (
    <motion.span
      key={String(value)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {value}
    </motion.span>
  )
}

export default function CommandCenter() {
  const [view, setView] = useState<View>('overview')
  const [timeStr, setTimeStr] = useState('')
  const [dateStr, setDateStr] = useState('')
  const rotationRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const update = () => {
      const d = new Date()
      setTimeStr(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`)
      setDateStr(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${['日','一','二','三','四','五','六'][d.getDay()]}`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    rotationRef.current = setInterval(() => {
      setView((prev) => {
        const idx = VIEWS.indexOf(prev)
        return VIEWS[(idx + 1) % VIEWS.length]
      })
    }, ROTATION_MS)
    return () => {
      if (rotationRef.current) clearInterval(rotationRef.current)
    }
  }, [])

  const switchView = (v: View) => {
    setView(v)
    if (rotationRef.current) clearInterval(rotationRef.current)
    rotationRef.current = setInterval(() => {
      setView((prev) => {
        const idx = VIEWS.indexOf(prev)
        return VIEWS[(idx + 1) % VIEWS.length]
      })
    }, ROTATION_MS)
  }

  const todayVisitors = 522
  const todayOnline = 3841
  const totalToday = todayVisitors + todayOnline

  return (
    <div className="cmd-root">
      {/* Header */}
      <header className="cmd-header">
        <div className="cmd-header-left">
          <div className="cmd-logo">
            <TrendingUp size={22} />
            <span>灵山胜境 · 智慧运营中心</span>
          </div>
          <div className="cmd-live-dot" />
          <span className="cmd-live-label">LIVE</span>
        </div>
        <div className="cmd-header-center">
          <div className="cmd-view-tabs">
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                className={`cmd-view-tab ${view === v ? 'active' : ''}`}
                onClick={() => switchView(v)}
              >
                {{ overview: '总览', demographics: '客群', revenue: '营收', status: '态势' }[v]}
              </button>
            ))}
          </div>
        </div>
        <div className="cmd-header-right">
          <div className="cmd-datetime">
            <span className="cmd-time">{timeStr}</span>
            <span className="cmd-date">{dateStr}</span>
          </div>
          <div className="cmd-weather">
            <CloudSun size={16} />
            <span>28° 晴</span>
          </div>
        </div>
      </header>

      {/* KPI strip */}
      <div className="cmd-kpi-strip">
        {[
          { icon: Users, label: '今日接待', value: totalToday.toLocaleString(), sub: `入园 ${todayVisitors} | 线上 ${todayOnline}`, color: '#15bba0' },
          { icon: Clock, label: '实时在园', value: '1,247', sub: '较昨日 +8%', color: '#155d58' },
          { icon: Wallet, label: '今日营收', value: '¥471,230', sub: '人均 ¥901', color: '#c1a15a' },
          { icon: Star, label: '今日满意度', value: '4.08', sub: '/5.0 · 好评率 92%', color: '#8ab89e' },
          { icon: Thermometer, label: '客流量等级', value: '舒适', sub: '承载率 52%', color: '#15bba0' },
        ].map((kpi) => (
          <div key={kpi.label} className="cmd-kpi-card">
            <kpi.icon size={18} style={{ color: kpi.color }} />
            <div className="cmd-kpi-body">
              <span className="cmd-kpi-label">{kpi.label}</span>
              <strong className="cmd-kpi-value" style={{ color: kpi.color }}>
                <AnimatedNumber value={kpi.value} />
              </strong>
              <span className="cmd-kpi-sub">{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main view area */}
      <div className="cmd-main">
        <AnimatePresence mode="wait">
          {view === 'overview' && (
            <motion.div
              key="overview"
              className="cmd-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="cmd-panel large">
                <div className="cmd-panel-head"><TrendingUp size={15} />月度游客趋势 (万人次)</div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MONTHLY_VISITS}>
                    <defs>
                      <linearGradient id="cmdVisit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#15bba0" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#15bba0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#1a2220', border: '1px solid #2a3a35', borderRadius: 8, color: '#fff' }} />
                    <Area type="monotone" dataKey="游客量" stroke="#15bba0" fill="url(#cmdVisit)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="cmd-panel">
                <div className="cmd-panel-head"><MapPin size={15} />热门景点 TOP5</div>
                <div className="cmd-spots-list">
                  {TOP_SPOTS.map((s, i) => (
                    <div key={s.name} className="cmd-spot-row">
                      <span className="cmd-spot-rank">{i + 1}</span>
                      <div className="cmd-spot-info">
                        <strong>{s.name}</strong>
                        <span>{s.visitors} 人次</span>
                      </div>
                      <div className="cmd-spot-bar-wrap">
                        <motion.div
                          className="cmd-spot-bar"
                          initial={{ width: 0 }}
                          animate={{ width: s.pct }}
                          transition={{ duration: 0.8, delay: i * 0.12 }}
                        />
                      </div>
                      <span className="cmd-spot-pct">{s.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'demographics' && (
            <motion.div
              key="demographics"
              className="cmd-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="cmd-panel">
                <div className="cmd-panel-head"><Users size={15} />年龄分布</div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={AGE_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={90} paddingAngle={3}>
                      {AGE_DATA.map((d) => (<Cell key={d.name} fill={d.fill} />))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a2220', border: '1px solid #2a3a35', borderRadius: 8, color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: 13, fill: 'rgba(255,255,255,0.6)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="cmd-panel">
                <div className="cmd-panel-head"><Users size={15} />性别分布</div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={GENDER_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={84} paddingAngle={4}>
                      {GENDER_DATA.map((d) => (<Cell key={d.name} fill={d.fill} />))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a2220', border: '1px solid #2a3a35', borderRadius: 8, color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: 13, fill: 'rgba(255,255,255,0.6)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="cmd-panel">
                <div className="cmd-panel-head"><Star size={15} />满意度分布</div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SATISFACTION_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#1a2220', border: '1px solid #2a3a35', borderRadius: 8, color: '#fff' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {SATISFACTION_DATA.map((d) => (<Cell key={d.name} fill={d.fill} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {view === 'revenue' && (
            <motion.div
              key="revenue"
              className="cmd-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="cmd-panel">
                <div className="cmd-panel-head"><Wallet size={15} />人均消费构成 (¥)</div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={SPENDING_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={90} paddingAngle={3}>
                      {SPENDING_DATA.map((d) => (<Cell key={d.name} fill={d.fill} />))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a2220', border: '1px solid #2a3a35', borderRadius: 8, color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: 13, fill: 'rgba(255,255,255,0.6)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="cmd-panel large">
                <div className="cmd-panel-head"><TrendingUp size={15} />月度营收趋势 (万元)</div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MONTHLY_VISITS.map((d) => ({ ...d, 营收: Math.round(d.游客量 * 9.01) }))}>
                    <defs>
                      <linearGradient id="cmdRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c1a15a" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#c1a15a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#1a2220', border: '1px solid #2a3a35', borderRadius: 8, color: '#fff' }} />
                    <Area type="monotone" dataKey="营收" stroke="#c1a15a" fill="url(#cmdRev)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {view === 'status' && (
            <motion.div
              key="status"
              className="cmd-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="cmd-panel">
                <div className="cmd-panel-head"><Wifi size={15} />设施状态</div>
                <div className="cmd-facilities">
                  {FACILITIES.map((f) => (
                    <div key={f.name} className="cmd-facility-row">
                      <div className={`cmd-facility-dot ${f.status}`} />
                      <span className="cmd-facility-name">{f.name}</span>
                      <div className="cmd-facility-bar-wrap">
                        <motion.div
                          className={`cmd-facility-bar ${f.status}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${f.load}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                      <span className={`cmd-facility-load ${f.status}`}>{f.load}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="cmd-panel">
                <div className="cmd-panel-head"><AlertTriangle size={15} />实时告警</div>
                <div className="cmd-alerts">
                  <div className="cmd-alert warn">
                    <AlertTriangle size={14} />
                    <div><strong>梵宫展厅客流预警</strong><span>承载率 91%，建议限流</span></div>
                    <span className="cmd-alert-time">2分钟前</span>
                  </div>
                  <div className="cmd-alert info">
                    <Check size={14} />
                    <div><strong>九龙灌浴演出正常</strong><span>下场演出 15:00</span></div>
                    <span className="cmd-alert-time">12分钟前</span>
                  </div>
                  <div className="cmd-alert info">
                    <Check size={14} />
                    <div><strong>全部系统运行正常</strong><span>API 响应 &lt; 80ms</span></div>
                    <span className="cmd-alert-time">刚刚</span>
                  </div>
                </div>
              </div>
              <div className="cmd-panel">
                <div className="cmd-panel-head"><MapPin size={15} />客流热力占位</div>
                <div className="cmd-heatmap-placeholder">
                  <div className="cmd-heatmap-grid">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        className="cmd-heatmap-cell"
                        style={{ opacity: [0.2, 0.6, 0.3, 0.8, 0.95, 0.7, 0.15, 0.4, 0.55][i] }}
                      />
                    ))}
                  </div>
                  <span className="cmd-heatmap-label">灵山胜境园区热力图 · 实时更新</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="cmd-footer">
        <div className="cmd-footer-left">
          <span>数据刷新间隔 5s</span>
          <span>·</span>
          <span>AI 数字人服务在线</span>
          <span>·</span>
          <span>Kiosk 终端 3 台在线</span>
        </div>
        <div className="cmd-footer-right">
          <span>Powered by 锐捷网络 · 中国软件杯 2026 A5</span>
        </div>
      </footer>
    </div>
  )
}
