import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { semestersService } from '@/services/semesters'

export default function AppLayout() {
  const { theme, toggle } = useTheme()
  const { user, logout }  = useAuth()
  const navigate          = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Semestres para a sidebar
  const { data: semesters } = useApi(() => semestersService.list())

  const initials = user?.name
    ?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'U'

  return (
    <div className="flex flex-col h-full">

      {/* ── TOPBAR ── */}
      <header className="flex items-center gap-2.5 px-3.5 shrink-0 border-b z-50"
        style={{ height: 48, background: 'var(--bg2)', borderColor: 'var(--border)' }}
      >
        {/* Hamburger mobile */}
        <button className="md:hidden w-8 h-8 rounded-sm flex items-center justify-center text-base"
          onClick={() => setSidebarOpen(o => !o)}
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >☰</button>

        {/* Logo */}
        <span className="font-display text-xl font-bold tracking-tight shrink-0 cursor-pointer"
          style={{ color: 'var(--accent)' }}
          onClick={() => navigate('/dashboard')}
        >
          cortex<span style={{ color: 'var(--text)' }}>.</span>
        </span>

        {/* Nav desktop */}
        <nav className="hidden md:flex gap-1 flex-1 justify-center">
          {[
            { to: '/dashboard', label: '🏠 Dashboard' },
            { to: '/calendario', label: '📅 Calendário' },
          ].map(({ to, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-sm text-[13px] font-medium transition-all duration-150 ${
                  isActive ? '' : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--surface2)]'
                }`
              }
              style={({ isActive }) => isActive ? { background: 'var(--surface)', color: 'var(--text)' } : {}}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Theme toggle */}
        <button onClick={toggle}
          className="w-8 h-8 rounded-sm flex items-center justify-center text-base transition-all ml-auto"
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)' }}
          title="Alternar tema"
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Overlay mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── SIDEBAR ── */}
        <aside
          className={`flex flex-col shrink-0 z-50 transition-transform duration-300
            fixed md:sticky left-0 top-0
            ${sidebarOpen ? 'translate-x-0 shadow-panel' : '-translate-x-full md:translate-x-0'}`}
          style={{ width: 228, background: 'var(--surface)', borderRight: '1px solid var(--border)', height: 'calc(100dvh - 48px)', top: 48 }}
        >
          {/* Scrollable nav area */}
          <div className="flex-1 overflow-y-auto py-2">
          {/* Geral */}
          <div className="px-2.5 mb-1">
            <div className="text-[10px] font-medium uppercase tracking-widest px-2 py-1.5" style={{ color: 'var(--text3)' }}>
              Geral
            </div>
            {[
              { to: '/dashboard',  icon: '⌂',  label: 'Dashboard'  },
              { to: '/calendario', icon: '📅', label: 'Calendário' },
            ].map(({ to, icon, label }) => (
              <NavLink key={to} to={to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              >
                <span className="w-4 text-center text-sm">{icon}</span> {label}
              </NavLink>
            ))}
          </div>

          {/* Semestres da API */}
          {semesters?.length > 0 && (
            <div className="px-2.5 mt-2">
              <div className="text-[10px] font-medium uppercase tracking-widest px-2 py-1.5" style={{ color: 'var(--text3)' }}>
                Semestres
              </div>
              {semesters.map((s, i) => (
                <div key={s._id} className={`sidebar-item ${i === 0 ? 'active' : ''}`}>
                  <span className="w-4 text-center text-sm">{i === 0 ? '◆' : '◇'}</span>
                  {s.name}
                  <span className="w-1.5 h-1.5 rounded-full ml-auto shrink-0"
                    style={{ background: i === 0 ? 'var(--accent)' : 'var(--border2)' }}
                  />
                </div>
              ))}
            </div>
          )}

          </div>{/* end scrollable */}
          {/* Usuário / logout */}
          <div className="shrink-0 px-2.5 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2.5 p-2.5 rounded-sm cursor-pointer transition-all"
              onClick={logout} title="Sair da conta"
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #5c6bff, #c8f560)', color: '#0d0e10' }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">{user?.name}</div>
                <div className="text-[11px] truncate" style={{ color: 'var(--text3)' }}>{user?.course || user?.email}</div>
              </div>
              <span className="text-xs" style={{ color: 'var(--text3)' }}>→</span>
            </div>
          </div>
        </aside>

        {/* ── CONTEÚDO ── */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* ── BOTTOM NAV mobile ── */}
      <nav className="md:hidden flex shrink-0 border-t z-50"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {[
          { to: '/dashboard',  icon: '⌂',  label: 'Dashboard'  },
          { to: '/calendario', icon: '📅', label: 'Calendário' },
        ].map(({ to, icon, label }) => (
          <NavLink key={to} to={to}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 select-none transition-colors"
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent)' : 'var(--text3)',
              paddingTop: 10,
              paddingBottom: `calc(10px + env(safe-area-inset-bottom))`,
            })}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  )
}
