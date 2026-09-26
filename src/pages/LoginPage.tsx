import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Card } from '../components/Card'
import { useAuth } from '../context/AuthContext'

type AuthTab = 'login' | 'register'

export function LoginPage() {
  const { user, isLoading, login, register } = useAuth()
  const [tab, setTab] = useState<AuthTab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isLoading && user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (tab === 'login') {
        await login(email, password)
      } else {
        await register(email, password, name)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-4 py-10">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-10 right-10 h-48 w-48 rounded-full bg-accent-400 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8 text-white">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-700 text-2xl font-bold mb-4">
            О
          </div>
          <h1 className="text-2xl font-bold">Обществознание</h1>
          <p className="text-brand-100 mt-2">Подготовка к ОГЭ и ЕГЭ</p>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setTab('login'); setError('') }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                tab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError('') }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                tab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Имя</span>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  className="mt-1.5 w-full rounded-xl border border-border px-4 py-3 text-base"
                  placeholder="Как вас зовут"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            )}

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                className="mt-1.5 w-full rounded-xl border border-border px-4 py-3 text-base"
                placeholder="example@mail.ru"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Пароль</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                className="mt-1.5 w-full rounded-xl border border-border px-4 py-3 text-base"
                placeholder="Не менее 6 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-brand-600 py-3.5 text-base font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              {submitting
                ? 'Подождите...'
                : tab === 'login'
                  ? 'Войти'
                  : 'Создать аккаунт'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  )
}
