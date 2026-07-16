import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import ErrorBoundary from '../components/ErrorBoundary'
import LoginPage from '../components/LoginPage'
import BigscreenPage from '../pages/BigscreenPage'
import '../index.css'
import '../App.css'
import '../pages/pages.css'

const isDemo = window.location.hostname.includes('github.io') || window.location.protocol === 'file:'

function Root() {
  const [authed, setAuthed] = useState(() => {
    if (isDemo) {
      localStorage.setItem('scenic_admin_token', 'demo-token')
      return true
    }
    return !!localStorage.getItem('scenic_admin_token')
  })

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />
  }

  return (
    <>
      <BigscreenPage />
      <button
        type="button"
        className="logout-btn-top"
        onClick={() => {
          localStorage.removeItem('scenic_admin_token')
          setAuthed(false)
        }}
      >
        退出登录
      </button>
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>,
)
