import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, TrendingUp, Star, Wallet, MapPin, Clock,
  Wifi, Thermometer, CloudSun, AlertTriangle, Check,
  Loader2,
} from 'lucide-react'
import {
  CartesianGrid, Pie, PieChart, Cell, BarChart, Bar,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
  Area, AreaChart,
} from 'recharts'
import { fetchCommandCenter, type CommandCenterData } from '../../api/admin'
import { useT, getLang } from '../../i18n'

const VIEWS = ['overview', 'demographics', 'revenue', 'status'] as const
type View = typeof VIEWS[number]
const ROTATION_MS = 18_000

const COLORS = ['#15bba0', '#155d58', '#c1a15a', '#e89460', '#8ab89e', '#b4522c']

function formatNumber(value: number) {
  return value.toLocaleString()
}

function formatMoney(value: number) {
  return `¥${value.toLocaleString()}`
}

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
  const [data, setData] = useState<CommandCenterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const rotationRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const t = useT()
  const isEn = getLang() === 'en'

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      const next = await fetchCommandCenter()
      if (cancelled) return
      if (next) {
        setData(next)
      } else {
        setError('运营数据暂不可用，请检查管理端服务')
      }
      setLoading(false)
    }
    void load()
    const timer = setInterval(load, 30_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    const update = () => {
      const d = new Date()
      const daysZh = ['日', '一', '二', '三', '四', '五', '六']
      const daysEn = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
      const dayNames = getLang() === 'en' ? daysEn : daysZh
      setTimeStr(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`)
      setDateStr(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${dayNames[d.getDay()]}`)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
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

  const monthlyVisits = data?.monthlyVisits.map((item) => ({
    ...item,
    month: isEn ? item.monthEn : item.month,
  })) ?? []

  const ageLabels = {
    under30: t('dashboard.ageUnder30'),
    '30to49': t('dashboard.age30to49'),
    over50: t('dashboard.ageOver50'),
  }
  const ageData = data?.ageDistribution.map((item, index) => ({
    name: ageLabels[item.key],
    value: item.value,
    fill: COLORS[index],
  })) ?? []

  const genderLabels = {
    male: t('dashboard.genderMale'),
    female: t('dashboard.genderFemale'),
  }
  const genderData = data?.genderDistribution.map((item, index) => ({
    name: genderLabels[item.key],
    value: item.value,
    fill: COLORS[index],
  })) ?? []

  const spendingLabels = {
    ticket: t('dashboard.spendTicket'),
    food: t('dashboard.spendFood'),
    shopping: t('dashboard.spendShopping'),
    transport: t('dashboard.spendTransport'),
    entertainment: t('dashboard.spendEntertainment'),
  }
  const spendingData = data?.spendingDistribution.map((item, index) => ({
    name: spendingLabels[item.key],
    value: item.value,
    fill: COLORS[index],
  })) ?? []

  const satisfactionData = data?.satisfactionDistribution.map((item, index) => ({
    name: `${item.stars}★`,
    value: item.value,
    fill: COLORS[index],
  })) ?? []

  const kpis = data ? [
    {
      icon: Users,
      label: t('cmd.todayVisitors'),
      value: formatNumber(data.kpis.todayVisitors.total),
      sub: `${t('cmd.inPark')} ${formatNumber(data.kpis.todayVisitors.inPark)} | ${t('cmd.online')} ${formatNumber(data.kpis.todayVisitors.online)}`,
      color: '#15bba0',
    },
    {
      icon: Clock,
      label: t('cmd.realtimeInPark'),
      value: formatNumber(data.kpis.realtimeInPark.value),
      sub: `${t('cmd.vsYesterday')} +${data.kpis.realtimeInPark.deltaPct}%`,
      color: '#155d58',
    },
    {
      icon: Wallet,
      label: t('cmd.todayRevenue'),
      value: formatMoney(data.kpis.todayRevenue.amount),
      sub: `${t('cmd.perCapita')} ${formatMoney(data.kpis.todayRevenue.perCapita)}`,
      color: '#c1a15a',
    },
    {
      icon: Star,
      label: t('cmd.todaySatisfaction'),
      value: data.kpis.todaySatisfaction.score.toFixed(2),
      sub: `/5.0 · ${t('cmd.goodRate')} ${data.kpis.todaySatisfaction.goodRatePct}%`,
      color: '#8ab89e',
    },
    {
      icon: Thermometer,
      label: t('cmd.crowdLevel'),
      value: data.kpis.crowd.level,
      sub: `${t('cmd.loadRate')} ${data.kpis.crowd.loadRatePct}%`,
      color: '#15bba0',
    },
  ] : []

  return (
    <div className="cmd-root">
      <header className="cmd-header">
        <div className="cmd-header-left">
          <div className="cmd-logo">
            <TrendingUp size={22} />
            <span>{t('cmd.title')}</span>
          </div>
          <div className="cmd-live-dot" />
          <span className="cmd-live-label">{data?.source === 'live' ? '实时' : '运营数据'}</span>
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
                {t(`cmd.${v}`)}
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
            <span>{data ? `${data.weather.temperatureC}° ${data.weather.condition}` : '--'}</span>
          </div>
        </div>
      </header>

      {loading && (
        <div className="cmd-main">
          <div className="kb-loading">
            <Loader2 size={28} className="spin" />
            <span>加载运营数据...</span>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="cmd-main">
          <div className="kb-empty-state">
            <AlertTriangle size={40} />
            <strong>数据暂不可用</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading && data && (
        <>
          <div className="cmd-kpi-strip">
            {kpis.map((kpi) => (
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
                    <div className="cmd-panel-head"><TrendingUp size={15} />{t('cmd.monthlyTrend')}</div>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyVisits}>
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
                        <Area type="monotone" dataKey="visitors" stroke="#15bba0" fill="url(#cmdVisit)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="cmd-panel">
                    <div className="cmd-panel-head"><MapPin size={15} />{t('cmd.topSpots')}</div>
                    <div className="cmd-spots-list">
                      {data.topSpots.map((s, i) => (
                        <div key={s.name} className="cmd-spot-row">
                          <span className="cmd-spot-rank">{i + 1}</span>
                          <div className="cmd-spot-info">
                            <strong>{s.name}</strong>
                            <span>{s.visitors} {t('cmd.visitorsUnit')}</span>
                          </div>
                          <div className="cmd-spot-bar-wrap">
                            <motion.div
                              className="cmd-spot-bar"
                              initial={{ width: 0 }}
                              animate={{ width: `${s.pct}%` }}
                              transition={{ duration: 0.8, delay: i * 0.12 }}
                            />
                          </div>
                          <span className="cmd-spot-pct">{s.pct.toFixed(1)}%</span>
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
                    <div className="cmd-panel-head"><Users size={15} />{t('cmd.ageDist')}</div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={ageData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={90} paddingAngle={3}>
                          {ageData.map((d) => (<Cell key={d.name} fill={d.fill} />))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1a2220', border: '1px solid #2a3a35', borderRadius: 8, color: '#fff' }} />
                        <Legend wrapperStyle={{ fontSize: 13, fill: 'rgba(255,255,255,0.6)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="cmd-panel">
                    <div className="cmd-panel-head"><Users size={15} />{t('cmd.genderDist')}</div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={84} paddingAngle={4}>
                          {genderData.map((d) => (<Cell key={d.name} fill={d.fill} />))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1a2220', border: '1px solid #2a3a35', borderRadius: 8, color: '#fff' }} />
                        <Legend wrapperStyle={{ fontSize: 13, fill: 'rgba(255,255,255,0.6)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="cmd-panel">
                    <div className="cmd-panel-head"><Star size={15} />{t('cmd.satisfactionDist')}</div>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={satisfactionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                        <Tooltip contentStyle={{ background: '#1a2220', border: '1px solid #2a3a35', borderRadius: 8, color: '#fff' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {satisfactionData.map((d) => (<Cell key={d.name} fill={d.fill} />))}
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
                    <div className="cmd-panel-head"><Wallet size={15} />{t('cmd.spendingDist')}</div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={spendingData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={90} paddingAngle={3}>
                          {spendingData.map((d) => (<Cell key={d.name} fill={d.fill} />))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1a2220', border: '1px solid #2a3a35', borderRadius: 8, color: '#fff' }} />
                        <Legend wrapperStyle={{ fontSize: 13, fill: 'rgba(255,255,255,0.6)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="cmd-panel large">
                    <div className="cmd-panel-head"><TrendingUp size={15} />{t('cmd.monthlyRevenue')}</div>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyVisits}>
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
                        <Area type="monotone" dataKey="revenue" stroke="#c1a15a" fill="url(#cmdRev)" strokeWidth={2.5} />
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
                    <div className="cmd-panel-head"><Wifi size={15} />{t('cmd.facilityStatus')}</div>
                    <div className="cmd-facilities">
                      {data.facilities.map((f) => (
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
                    <div className="cmd-panel-head"><AlertTriangle size={15} />{t('cmd.realtimeAlerts')}</div>
                    <div className="cmd-alerts">
                      {data.alerts.map((alert) => (
                        <div key={`${alert.title}-${alert.timeAgo}`} className={`cmd-alert ${alert.level}`}>
                          {alert.level === 'warn' ? <AlertTriangle size={14} /> : <Check size={14} />}
                          <div><strong>{alert.title}</strong><span>{alert.message}</span></div>
                          <span className="cmd-alert-time">{alert.timeAgo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="cmd-panel">
                    <div className="cmd-panel-head"><MapPin size={15} />{t('cmd.heatmap')}</div>
                    <div className="cmd-heatmap-placeholder">
                      <div className="cmd-heatmap-grid">
                        {data.heatmapCells.map((opacity, i) => (
                          <div
                            key={i}
                            className="cmd-heatmap-cell"
                            style={{ opacity }}
                          />
                        ))}
                      </div>
                      <span className="cmd-heatmap-label">{t('cmd.heatmapLabel')}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      <footer className="cmd-footer">
        <div className="cmd-footer-left">
          <span>{t('cmd.refreshInterval')} {data?.refreshIntervalSeconds ?? 5}s</span>
          <span>·</span>
          <span>{t('cmd.aiOnline')}</span>
          <span>·</span>
          <span>{t('cmd.kioskOnline', { n: 3 })}</span>
        </div>
        <div className="cmd-footer-right">
          <span>灵山胜境智慧运营平台</span>
        </div>
      </footer>
    </div>
  )
}
