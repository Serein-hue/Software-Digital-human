import { Mountain } from 'lucide-react'

const navPages = [
  { id: 'operation', label: '运营中心', href: './operation/' },
  { id: 'bigscreen', label: '数据大屏', href: './bigscreen/' },
  { id: 'digital-human', label: '数字人管理', href: './digital-human/' },
  { id: 'admin', label: '后台管理', href: './admin/' },
]

export function Layout({
  currentPage,
  title,
  children,
}: {
  currentPage: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-header-inner">
          <div className="page-brand">
            <Mountain size={26} strokeWidth={1.8} />
            <span>灵山景区 AI 数字人平台</span>
          </div>
          <nav className="page-nav">
            {navPages.map((p) => (
              <a
                key={p.id}
                href={p.href}
                className={p.id === currentPage ? 'nav-active' : ''}
              >
                {p.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <div className="page-body">
        <div className="page-title-bar">
          <h1>{title}</h1>
        </div>
        {children}
      </div>
    </div>
  )
}
