import type { StudentState } from '../../types'
import type { AuthUser, UserRole } from '../../types/auth'
import { normalizeStudentState } from '../../utils/storage'
import type { Backend, NewTaskEvent, StudentSummary, TaskEvent } from './types'

/**
 * Работа с Supabase напрямую через HTTP API (Auth + PostgREST), без библиотеки supabase-js.
 * Настройки берутся из .env: VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.
 */

interface Session {
  access_token: string
  refresh_token: string
  expires_at: number // секунды unix
  user_id: string
}

interface ProfileRow {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
  notifications_seen_at: string | null
}

interface EventRow {
  id: number
  student_id: string
  student_name: string
  task_id: string
  module_id: string
  format: 'test' | 'written'
  kind: string | null
  slot_title: string | null
  score: number
  max_score: number
  correct: boolean
  created_at: string
}

const SESSION_KEY = 'obshchestvoznanie-sb-session'

export function createSupabaseBackend(url: string, anonKey: string): Backend {
  const base = url.replace(/\/+$/, '')
  let session: Session | null = readSession()
  let refreshing: Promise<void> | null = null

  function readSession(): Session | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      return raw ? (JSON.parse(raw) as Session) : null
    } catch {
      return null
    }
  }

  function storeSession(data: {
    access_token: string
    refresh_token: string
    expires_in?: number
    expires_at?: number
    user: { id: string }
  }) {
    session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at ?? Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
      user_id: data.user.id,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  function clearSession() {
    session = null
    localStorage.removeItem(SESSION_KEY)
  }

  async function readError(res: Response): Promise<string> {
    try {
      const body = await res.json()
      return body.msg || body.message || body.error_description || body.error || `Ошибка ${res.status}`
    } catch {
      return `Ошибка ${res.status}`
    }
  }

  async function authRequest(path: string, body: unknown) {
    const res = await fetch(`${base}/auth/v1/${path}`, {
      method: 'POST',
      headers: { apikey: anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(translateAuthError(await readError(res)))
    return res.json()
  }

  async function ensureFreshToken() {
    if (!session) throw new Error('Нужно войти заново')
    if (session.expires_at - 60 > Date.now() / 1000) return
    if (!refreshing) {
      refreshing = (async () => {
        try {
          const data = await authRequest('token?grant_type=refresh_token', { refresh_token: session!.refresh_token })
          storeSession(data)
        } catch (e) {
          clearSession()
          throw e
        } finally {
          refreshing = null
        }
      })()
    }
    await refreshing
  }

  async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
    await ensureFreshToken()
    const res = await fetch(`${base}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${session!.access_token}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    })
    if (!res.ok) throw new Error(await readError(res))
    if (res.status === 204) return undefined as T
    const text = await res.text()
    return (text ? JSON.parse(text) : undefined) as T
  }

  async function fetchProfile(userId: string): Promise<ProfileRow | null> {
    const rows = await rest<ProfileRow[]>(`profiles?id=eq.${userId}&select=*`)
    return rows[0] ?? null
  }

  function toUser(p: ProfileRow): AuthUser {
    return { id: p.id, email: p.email, name: p.name, role: p.role, createdAt: p.created_at }
  }

  async function currentUser(): Promise<AuthUser> {
    const profile = await fetchProfile(session!.user_id)
    if (!profile) throw new Error('Профиль не найден. Проверьте, что в Supabase выполнен файл supabase/schema.sql')
    return toUser(profile)
  }

  function toEvent(r: EventRow): TaskEvent {
    return {
      id: String(r.id),
      studentId: r.student_id,
      studentName: r.student_name,
      taskId: r.task_id,
      moduleId: r.module_id,
      format: r.format,
      kind: r.kind ?? undefined,
      slotTitle: r.slot_title ?? undefined,
      score: r.score,
      maxScore: r.max_score,
      correct: r.correct,
      createdAt: r.created_at,
    }
  }

  return {
    mode: 'supabase',

    async restore() {
      if (!session) return null
      try {
        return await currentUser()
      } catch {
        clearSession()
        return null
      }
    },

    async signIn(email, password) {
      const data = await authRequest('token?grant_type=password', { email: email.trim(), password })
      storeSession(data)
      return currentUser()
    },

    async signUp({ email, password, name, role, teacherCode }) {
      let data
      try {
        data = await authRequest('signup', {
          email: email.trim(),
          password,
          data: { name: name.trim(), role, teacher_code: role === 'teacher' ? teacherCode?.trim() : undefined },
        })
      } catch (e) {
        if (role === 'teacher' && e instanceof Error && /database error/i.test(e.message)) {
          throw new Error('Неверный код учителя')
        }
        throw e
      }
      if (!data.access_token) return { needsConfirmation: true }
      storeSession(data)
      return { user: await currentUser() }
    },

    async signOut() {
      if (session) {
        await fetch(`${base}/auth/v1/logout`, {
          method: 'POST',
          headers: { apikey: anonKey, Authorization: `Bearer ${session.access_token}` },
        }).catch(() => undefined)
      }
      clearSession()
    },

    async loadState(userId) {
      const rows = await rest<{ state: Partial<StudentState>; updated_at: string }[]>(
        `student_states?user_id=eq.${userId}&select=state,updated_at`,
      )
      if (!rows[0]) return null
      return { state: normalizeStudentState(rows[0].state), updatedAt: rows[0].updated_at }
    },

    async saveState(userId, state) {
      await rest('student_states?on_conflict=user_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ user_id: userId, state, updated_at: new Date().toISOString() }),
      })
    },

    async logEvent(event: NewTaskEvent) {
      await rest('task_events', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          student_id: event.studentId,
          student_name: event.studentName,
          task_id: event.taskId,
          module_id: event.moduleId,
          format: event.format,
          kind: event.kind ?? null,
          slot_title: event.slotTitle ?? null,
          score: event.score,
          max_score: event.maxScore,
          correct: event.correct,
        }),
      })
    },

    async listStudents() {
      const [profiles, states] = await Promise.all([
        rest<ProfileRow[]>('profiles?role=eq.student&select=*&order=name.asc'),
        rest<{ user_id: string; state: Partial<StudentState>; updated_at: string }[]>(
          'student_states?select=user_id,state,updated_at',
        ),
      ])
      const byUser = new Map(states.map((s) => [s.user_id, s]))
      return profiles.map<StudentSummary>((p) => {
        const s = byUser.get(p.id)
        return {
          id: p.id,
          name: p.name,
          email: p.email,
          createdAt: p.created_at,
          state: s ? normalizeStudentState(s.state) : null,
          updatedAt: s?.updated_at ?? null,
        }
      })
    },

    async getStudent(id) {
      const [profiles, states] = await Promise.all([
        rest<ProfileRow[]>(`profiles?id=eq.${id}&select=*`),
        rest<{ state: Partial<StudentState>; updated_at: string }[]>(
          `student_states?user_id=eq.${id}&select=state,updated_at`,
        ),
      ])
      const p = profiles[0]
      if (!p) return null
      return {
        id: p.id,
        name: p.name,
        email: p.email,
        createdAt: p.created_at,
        state: states[0] ? normalizeStudentState(states[0].state) : null,
        updatedAt: states[0]?.updated_at ?? null,
      }
    },

    async listEvents({ limit = 200, studentId } = {}) {
      const filter = studentId ? `&student_id=eq.${studentId}` : ''
      const rows = await rest<EventRow[]>(`task_events?select=*&order=created_at.desc&limit=${limit}${filter}`)
      return rows.map(toEvent)
    },

    async getNotificationsSeenAt(userId) {
      const profile = await fetchProfile(userId)
      return profile?.notifications_seen_at ?? null
    },

    async markNotificationsSeen(userId) {
      await rest(`profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ notifications_seen_at: new Date().toISOString() }),
      })
    },
  }
}

function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Неверный email или пароль'
  if (/email not confirmed/i.test(message)) return 'Email не подтверждён — откройте письмо от сайта и перейдите по ссылке'
  if (/already registered|already been registered/i.test(message)) return 'Пользователь с таким email уже существует'
  if (/password should be at least/i.test(message)) return 'Пароль должен быть не короче 6 символов'
  if (/rate limit/i.test(message)) return 'Слишком много попыток, подождите минуту'
  if (/unable to validate email|invalid email/i.test(message)) return 'Проверьте правильность email'
  return message
}
