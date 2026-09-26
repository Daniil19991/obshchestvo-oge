import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Card } from '../components/Card'
import { Logo } from '../components/Layout'
import { ModuleArt } from '../components/ModuleArt'
import { theoryModules } from '../data/theory'
import { useAuth } from '../context/AuthContext'
import { LOCAL_TEACHER_CODE, backend } from '../lib/backend'
import type { UserRole } from '../types/auth'

type AuthTab = 'login' | 'register'

export function LoginPage() {
  const { user, isLoading, login, register } = useAuth()
  const [tab, setTab] = useState<AuthTab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [teacherCode, setTeacherCode] = useState('')
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isLoading && user) {
    return <Navigate to={user.role === 'teacher' ? '/teacher' : '/'} replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)
    try {
      if (tab === 'login') {
        await login(email, password)
      } else {
        const result = await register({ email, password, name, role, teacherCode })
        if (result === 'confirm') {
          setInfo('Аккаунт создан! Мы отправили письмо на ваш email — перейдите по ссылке в нём, а потом войдите.')
          setTab('login')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-svh grid lg:grid-cols-[1.05fr_1fr]">
      {/* Левая часть — иллюстрация */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-[#ffc4a0]/25 blur-3xl" />
        <div className="relative">
          <Logo subtitle="Подготовка к ОГЭ" light />
        </div>
        <div className="relative">
          <h1 className="max-w-md text-4xl font-bold leading-tight">Обществознание — спокойно и по плану</h1>
          <p className="mt-4 max-w-md text-white/75">
            Теория по темам, задания из банка ФИПИ, карточки с понятиями и понятная цель — «5» на экзамене.
          </p>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
            {theoryModules.map((m, i) => (
              <div
                key={m.id}
                className="flex flex-col items-center gap-2 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur"
                style={{ transform: `translateY(${i % 2 ? 10 : 0}px)` }}
              >
                <ModuleArt moduleId={m.id} size={44} />
                <span className="text-center text-[11px] leading-tight text-white/85">{m.title}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-sm text-white/60">ОГЭ 2027 · 20 заданий · 32 балла</p>
      </div>

      {/* Правая часть — форма */}
      <div className="flex items-center justify-center px-4 py-10">
      <div className="page-in w-full max-w-md">
        <div className="mb-8 lg:hidden">
          <Logo subtitle="Подготовка к ОГЭ" />
        </div>
        <h2 className="text-2xl font-bold text-ink">{tab === 'login' ? 'С возвращением!' : 'Создаём аккаунт'}</h2>
        <p className="mt-1 mb-6 text-muted">
          {tab === 'login' ? 'Войдите, чтобы продолжить подготовку' : 'Это займёт меньше минуты'}
        </p>

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
              <div>
                <span className="text-sm font-medium text-slate-700">Я —</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {([
                    ['student', '🎒', 'Ученик'],
                    ['teacher', '🧑‍🏫', 'Учитель'],
                  ] as const).map(([value, icon, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRole(value)}
                      className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${
                        role === value
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-border text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === 'register' && role === 'teacher' && (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Код учителя</span>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  className="mt-1.5 w-full rounded-xl border border-border bg-slate-50/60 px-4 py-3 text-base outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
                  placeholder="Выдаётся администратором сайта"
                  value={teacherCode}
                  onChange={(e) => setTeacherCode(e.target.value)}
                />
              </label>
            )}

            {tab === 'register' && (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Имя</span>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  className="mt-1.5 w-full rounded-xl border border-border bg-slate-50/60 px-4 py-3 text-base outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
                  placeholder={role === 'teacher' ? 'Например, Иван Петрович' : 'Имя и фамилия'}
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
                className="mt-1.5 w-full rounded-xl border border-border bg-slate-50/60 px-4 py-3 text-base outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
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
                className="mt-1.5 w-full rounded-xl border border-border bg-slate-50/60 px-4 py-3 text-base outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
                placeholder="Не менее 6 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {info && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800">
                {info}
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3.5 text-base disabled:opacity-60"
            >
              {submitting
                ? 'Подождите...'
                : tab === 'login'
                  ? 'Войти'
                  : role === 'teacher'
                    ? 'Создать аккаунт учителя'
                    : 'Создать аккаунт ученика'}
            </button>
          </form>
        </Card>

        {backend.mode === 'local' && (
          <div className="mt-4 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
            <strong>Демо-режим:</strong> сервер ещё не подключён, аккаунты хранятся только в этом браузере.
            Код учителя для проверки: <strong>{LOCAL_TEACHER_CODE}</strong>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
