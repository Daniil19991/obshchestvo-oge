import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStudent } from '../context/StudentContext'

const navItems = [
  { to: '/', label: 'Главная', end: true },
  { to: '/theory', label: 'Теория' },
  { to: '/practice', label: 'Задания' },
  { to: '/cabinet', label: 'Личный кабинет' },
  { to: '/goals', label: 'Моя цель' },
]

export function Layout() {
  const { theoryProgress } = useStudent()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-svh flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white text-lg font-bold">
              О
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-slate-900 leading-tight">Обществознание</div>
              <div className="text-xs text-muted">Подготовка к ОГЭ · ЕГЭ</div>
            </div>
          </NavLink>

          <nav className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-900 leading-tight">{user?.name}</div>
              <div className="text-xs text-muted truncate max-w-[140px]">{user?.email}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>

        <div className="md:hidden flex items-center justify-between px-4 pb-2 gap-2">
          <span className="text-sm text-slate-700 truncate">{user?.name}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-medium text-brand-600 shrink-0"
          >
            Выйти
          </button>
        </div>

        <div className="h-0.5 bg-slate-100">
          <div
            className="h-full bg-brand-500 transition-all duration-500"
            style={{ width: `${theoryProgress}%` }}
          />
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center text-sm text-muted">
          Платформа подготовки к ОГЭ и ЕГЭ по обществознанию
        </div>
      </footer>
    </div>
  )
}
