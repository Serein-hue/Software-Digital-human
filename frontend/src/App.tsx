import { lazy, Suspense, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import GuidePage from './components/guide/GuidePage'
import KioskPage from './components/guide/KioskPage'
import ErrorBoundary from './components/ErrorBoundary'
import LoginPage from './components/LoginPage'
import { getLang, setLang, type Lang } from './i18n'

const DataDashboard = lazy(() => import('./components/admin/DataDashboard'))
const KnowledgeBase = lazy(() => import('./components/admin/KnowledgeBase'))
const ContentReview = lazy(() => import('./components/admin/ContentReview'))
const DigitalHumanConfig = lazy(() => import('./components/admin/DigitalHumanConfig'))
const SystemSettings = lazy(() => import('./components/admin/SystemSettings'))
const CommandCenter = lazy(() => import('./components/admin/CommandCenter'))
const DigitalHumanMonitor = lazy(() => import('./components/admin/DigitalHumanMonitor'))
const WorkOrderCenter = lazy(() => import('./components/admin/WorkOrderCenter'))

import {
  HashRouter,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom'
import './App.css'

function App() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('scenic_admin_token'))

  const handleLogin = () => {
    setAuthed(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('scenic_admin_token')
    setAuthed(false)
  }

  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          {/* 公开页面 */}
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/kiosk" element={<KioskPage />} />

          {/* 登录页 — 已登录则跳转管理后台 */}
          <Route
            path="/"
            element={
              authed ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />
            }
          />

          {/* 管理后台 — 未登录跳转登录页 */}
          {authed ? (
            <>
              <Route path="/dashboard" element={<Suspense fallback={<PageLoading />}><DataDashboard /></Suspense>} />
              <Route path="/knowledge" element={<Suspense fallback={<PageLoading />}><KnowledgeBase /></Suspense>} />
              <Route path="/review" element={<Suspense fallback={<PageLoading />}><ContentReview /></Suspense>} />
              <Route path="/digital-human" element={<Suspense fallback={<PageLoading />}><DigitalHumanConfig /></Suspense>} />
              <Route path="/settings" element={<Suspense fallback={<PageLoading />}><SystemSettings /></Suspense>} />
              <Route path="/command" element={<Suspense fallback={<PageLoading />}><CommandCenter /></Suspense>} />
              <Route path="/digital-human-monitor" element={<Suspense fallback={<PageLoading />}><DigitalHumanMonitor /></Suspense>} />
              <Route path="/work-orders" element={<Suspense fallback={<PageLoading />}><WorkOrderCenter /></Suspense>} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/" replace />} />
          )}
        </Routes>

        {/* 退出登录按钮（仅管理页面展示） */}
        {authed && (
          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
            title="退出登录"
          >
            退出
          </button>
        )}
      </HashRouter>
    </ErrorBoundary>
  )
}

function PageLoading() {
  return <div className="page-loading"><span>加载中...</span></div>
}

export default App
