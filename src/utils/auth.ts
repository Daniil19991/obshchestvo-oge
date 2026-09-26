import type { AuthSession, AuthUser, StoredUser, UserRole } from '../types/auth'

/*
 * Локальная (демо) авторизация: пользователи хранятся в localStorage этого браузера.
 * Используется, только когда Supabase не настроен (см. src/lib/backend).
 */

const USERS_KEY = 'obshchestvoznanie-users'
const SESSION_KEY = 'obshchestvoznanie-session'

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    return (JSON.parse(raw) as StoredUser[]).map((u) => ({ ...u, role: u.role ?? 'student' }))
  } catch {
    return []
  }
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function toAuthUser(user: StoredUser): AuthUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt }
}

export function listLocalUsers(): AuthUser[] {
  return loadUsers().map(toAuthUser)
}

export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

function saveSession(session: AuthSession | null): void {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

export function getSessionUser(): AuthUser | null {
  const session = loadSession()
  if (!session) return null
  const user = loadUsers().find((u) => u.id === session.userId)
  if (!user) {
    saveSession(null)
    return null
  }
  return toAuthUser(user)
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: UserRole = 'student',
): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLowerCase()
  const users = loadUsers()

  if (users.some((u) => u.email === normalizedEmail)) {
    throw new Error('Пользователь с таким email уже существует')
  }

  if (password.length < 6) {
    throw new Error('Пароль должен быть не короче 6 символов')
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    name: name.trim() || (role === 'teacher' ? 'Учитель' : 'Ученик'),
    role,
    createdAt: new Date().toISOString(),
    passwordHash: await hashPassword(password),
  }

  users.push(user)
  saveUsers(users)
  saveSession({ userId: user.id, email: user.email, name: user.name })
  return toAuthUser(user)
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLowerCase()
  const user = loadUsers().find((u) => u.email === normalizedEmail)

  if (!user) {
    throw new Error('Неверный email или пароль')
  }

  const passwordHash = await hashPassword(password)
  if (user.passwordHash !== passwordHash) {
    throw new Error('Неверный email или пароль')
  }

  saveSession({ userId: user.id, email: user.email, name: user.name })
  return toAuthUser(user)
}

export function logoutUser(): void {
  saveSession(null)
}
