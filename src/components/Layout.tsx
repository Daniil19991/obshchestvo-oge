import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStudent } from '../context/StudentContext'
import { NavIcon, type NavIconName } from './NavIcon'

const navItems: { to: string; label: string; short: string; icon: NavIconName; end?: boolean }[] = [
  { to: '/', label: 'Главная', short: 'Главная', icon: 'home', end: true },
  { to: '/theory', label: 'Теория', short: 'Теория', icon: 'book' },
  { to: '/practice', label: 'Задания', short: 'Задания', icon: 'pen' },
  { to: '/goals', label: 'Моя цель', short: 'Цель', icon: 'target' },
  { to: '/cabinet', label: 'Кабинет', short: 'Кабинет', icon: 'user' },
]

export function Logo({ subtitle, light = false }: { subtitle: string; light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5 shrink-0">
      <span className={`relative flex h-9 w-9 items-center justify-center rounded-[11px] shadow-soft ${light ? 'bg-white/20 ring-1 ring-white/30' : 'bg-gradient-to-br from-brand-400 to-brand-700'}`}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="6.5" />
          <circle cx="12" cy="12" r="1.6" fill="white" stroke="none" />
        </svg>
      </span>
      <span className="hidden sm:block">
        <span className={`block text-sm font-semibold leading-tight ${light ? 'text-white' : 'text-ink'}`}>Обществознание</span>
        <span className={`block text-xs ${light ? 'text-white/70' : 'text-muted'}`}>{subtitle}</span>
      </span>
    </span>
  )
}

export function Layout() {
  const { theoryProgress, state } = useStudent()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-svh flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <NavLink to="/">
            <Logo subtitle="Подготовка к ОГЭ" />
          </NavLink>

          <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-slate-900/[0.04] p-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                    isActive ? 'bg-white text-ink shadow-soft' : 'text-slate-500 hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <NavIcon name={item.icon} className={isActive ? 'text-brand-600' : ''} />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <NavLink
              to="/cabinet"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-sm font-bold text-brand-700"
              title={state.profile.name}
            >
              {state.profile.avatarInitials}
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-900/5 hover:text-ink transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>

        <div className="h-[3px] bg-transparent">
          <div
            className="h-full rounded-r-full bg-gradient-to-r from-brand-300 via-brand-500 to-brand-600 transition-all duration-700"
            style={{ width: `${theoryProgress}%` }}
            title={`Теория: ${theoryProgress}%`}
          />
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">
        <div key={location.pathname} className="page-in">
          <Outlet />
        </div>
      </main>

      <footer className="hidden md:block border-t border-border/70 py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center text-sm text-muted">
          Платформа подготовки к ОГЭ по обществознанию
        </div>
      </footer>

      {/* Нижнее меню на телефоне */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-white/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-brand-600' : 'text-slate-400'
                }`
              }
            >
              <NavIcon name={item.icon} size={22} />
              {item.short}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
