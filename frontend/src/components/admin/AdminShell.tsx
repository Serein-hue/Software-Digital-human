import type { ReactNode } from 'react'
import { useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import {
  Activity,
  BookOpenCheck,
  Bot,
  BrainCircuit,
  ClipboardCheck,
  Command,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  TicketCheck,
} from 'lucide-react'
import AmbientMotion from '../AmbientMotion'
import { useT } from '../../i18n'

gsap.registerPlugin(useGSAP)

interface AdminShellProps {
  children: ReactNode
  onLogout: () => void
}

const NAV_ITEMS = [
  { to: '/dashboard', key: 'adminShell.dashboard', icon: LayoutDashboard },
  { to: '/command', key: 'adminShell.command', icon: Command },
  { to: '/knowledge', key: 'adminShell.knowledge', icon: BrainCircuit },
  { to: '/review', key: 'adminShell.review', icon: ClipboardCheck },
  { to: '/digital-human', key: 'adminShell.digitalHuman', icon: Bot },
  { to: '/digital-human-monitor', key: 'adminShell.monitor', icon: Activity },
  { to: '/work-orders', key: 'adminShell.workOrders', icon: TicketCheck },
  { to: '/settings', key: 'adminShell.settings', icon: Settings },
]

export default function AdminShell({ children, onLogout }: AdminShellProps) {
  const t = useT()
  const shellRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(
      '.admin-shell-nav-item',
      { autoAlpha: 0, x: -12 },
      { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.045, ease: 'power3.out', clearProps: 'transform,opacity,visibility' },
    )
    gsap.fromTo(
      '.admin-shell-content',
      { autoAlpha: 0, y: 14 },
      { autoAlpha: 1, y: 0, duration: 0.65, ease: 'power3.out', clearProps: 'transform,opacity,visibility' },
    )
  }, { scope: shellRef })

  return (
    <div ref={shellRef} className="admin-shell">
      <AmbientMotion variant="admin" />
      <aside className="admin-shell-sidebar" aria-label={t('adminShell.navigation')}>
        <div className="admin-shell-brand">
          <span className="admin-shell-brand-mark"><Sparkles size={20} /></span>
          <div>
            <span>{t('adminShell.eyebrow')}</span>
            <strong>{t('adminShell.title')}</strong>
          </div>
        </div>

        <div className="admin-shell-role">
          <span className="admin-shell-live-dot" />
          <div>
            <strong>{t('adminShell.role')}</strong>
            <span>{t('adminShell.live')}</span>
          </div>
        </div>

        <nav className="admin-shell-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin-shell-nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} />
              <span>{t(item.key)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-shell-sidebar-footer">
          <button type="button" className="admin-shell-utility danger" onClick={onLogout}>
            <LogOut size={17} />
            <span>{t('adminShell.logout')}</span>
          </button>
        </div>
      </aside>

      <main className="admin-shell-main">
        <header className="admin-shell-topbar">
          <div>
            <span className="admin-shell-topbar-eyebrow"><BookOpenCheck size={14} /> {t('adminShell.context')}</span>
            <strong>{t('adminShell.subtitle')}</strong>
          </div>
          <div className="admin-shell-topbar-status">
            <span className="admin-shell-live-dot" />
            <span>{t('adminShell.systemOnline')}</span>
          </div>
        </header>
        <div className="admin-shell-content">{children}</div>
      </main>
    </div>
  )
}
