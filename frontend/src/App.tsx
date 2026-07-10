import { lazy, Suspense, useState, type ReactNode } from 'react'
import GuidePage from './components/guide/GuidePage'
import KioskPage from './components/guide/KioskPage'
import ErrorBoundary from './components/ErrorBoundary'
import LoginPage from './components/LoginPage'
import AdminShell from './components/admin/AdminShell'
import { useT } from './i18n'

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
import './modern.css'

function App() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('scenic_admin_token'))

  const handleLogin = () => setAuthed(true)
  const handleLogout = () => {
    localStorage.removeItem('scenic_admin_token')
    setAuthed(false)
  }

  const adminPage = (content: ReactNode) => (
    <AdminShell onLogout={handleLogout}>
      <Suspense fallback={<PageLoading />}>{content}</Suspense>
    </AdminShell>
  )

  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/kiosk" element={<KioskPage />} />
          <Route
            path="/"
            element={authed ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />}
          />

          {authed ? (
            <>
              <Route path="/dashboard" element={adminPage(<DataDashboard />)} />
              <Route path="/knowledge" element={adminPage(<KnowledgeBase />)} />
              <Route path="/review" element={adminPage(<ContentReview />)} />
              <Route path="/digital-human" element={adminPage(<DigitalHumanConfig />)} />
              <Route path="/settings" element={adminPage(<SystemSettings />)} />
              <Route path="/command" element={adminPage(<CommandCenter />)} />
              <Route path="/digital-human-monitor" element={adminPage(<DigitalHumanMonitor />)} />
              <Route path="/work-orders" element={adminPage(<WorkOrderCenter />)} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/" replace />} />
          )}
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}

function PageLoading() {
  const t = useT()
  return (
    <div className="modern-page-loading" role="status">
      <span className="modern-loader-orbit" />
      <span>{t('common.loading')}</span>
    </div>
  )
}

export default App
