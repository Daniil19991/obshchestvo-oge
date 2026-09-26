import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types/auth'

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white text-xl font-bold animate-pulse">
            О
          </div>
          <p className="mt-4 text-muted">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

/** Пускает только пользователей с нужной ролью, остальных отправляет на их главную. */
export function RoleGate({ role }: { role: UserRole }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={user.role === 'teacher' ? '/teacher' : '/'} replace />
  return <Outlet />
}
