import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TeacherProvider, useTeacher } from '../context/TeacherContext'
import { Logo } from './Layout'
import { ModuleArt } from './ModuleArt'

export function TeacherLayout() {
  return (
    <TeacherProvider>
      <TeacherShell />
    </TeacherProvider>
  )
}

function TeacherShell() {
  const { user, logout } = useAuth()
  const { unreadCount } = useTeacher()
  const navigate = useNavigate()
  const location = useLocation()

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `relative whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-white text-ink shadow-soft' : 'text-slate-500 hover:text-ink'
    }`

  return (
    <div className="min-h-svh flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <NavLink to="/teacher">
            <Logo subtitle="Кабинет учителя" />
          </NavLink>

          <nav className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-slate-900/[0.04] p-1">
            <NavLink to="/teacher" end className={navClass}>
              Ученики
            </NavLink>
            <NavLink to="/teacher/feed" className={navClass}>
              Уведомления
              {unreadCount > 0 && (
                <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium text-slate-900 leading-tight">{user?.name}</div>
              <div className="text-xs text-muted">учитель</div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div key={location.pathname} className="page-in">
          <Outlet />
        </div>
      </main>

      <Toasts />
    </div>
  )
}

function Toasts() {
  const { toasts, dismissToast } = useTeacher()
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4 shadow-lg">
          <ModuleArt moduleId={t.moduleId} size={40} />
          <Link to={`/teacher/students/${t.studentId}`} onClick={() => dismissToast(t.id)} className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900">{t.studentName} решил(а) задание</div>
            <div className="text-sm text-muted truncate">{t.slotTitle ?? 'Задания'}</div>
            <div className={`text-sm font-semibold ${t.correct ? 'text-emerald-600' : 'text-rose-600'}`}>
              {t.correct ? '✓ верно' : '✗ с ошибкой'} · {t.score}/{t.maxScore}
            </div>
          </Link>
          <button type="button" onClick={() => dismissToast(t.id)} className="text-slate-400 hover:text-slate-700" aria-label="Закрыть">
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
