import type { StudentState } from '../../types'
import {
  getSessionUser,
  listLocalUsers,
  loginUser,
  logoutUser,
  registerUser,
} from '../../utils/auth'
import { normalizeStudentState } from '../../utils/storage'
import type { Backend, NewTaskEvent, StudentSummary, TaskEvent } from './types'

/**
 * Демо-режим без сервера: все аккаунты, прогресс и уведомления — в localStorage этого браузера.
 * Учитель видит только учеников, зарегистрированных в этом же браузере.
 */
export const LOCAL_TEACHER_CODE = '2027'

const EVENTS_KEY = 'obshchestvoznanie-events'
const SEEN_KEY = 'obshchestvoznanie-seen-'
const stateKey = (userId: string) => `obshchestvoznanie-student-${userId}`
const stateTimeKey = (userId: string) => `obshchestvoznanie-student-time-${userId}`

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function readEvents(): TaskEvent[] {
  return readJson<TaskEvent[]>(EVENTS_KEY, [])
}

function readState(userId: string): StudentSummary['state'] {
  const raw = readJson<Partial<StudentState> | null>(stateKey(userId), null)
  return raw ? normalizeStudentState(raw) : null
}

export const localBackend: Backend = {
  mode: 'local',

  async restore() {
    return getSessionUser()
  },

  async signIn(email, password) {
    return loginUser(email, password)
  },

  async signUp({ email, password, name, role, teacherCode }) {
    if (role === 'teacher' && teacherCode?.trim() !== LOCAL_TEACHER_CODE) {
      throw new Error('Неверный код учителя')
    }
    return { user: await registerUser(email, password, name, role) }
  },

  async signOut() {
    logoutUser()
  },

  async loadState(userId) {
    const state = readState(userId)
    if (!state) return null
    return { state, updatedAt: localStorage.getItem(stateTimeKey(userId)) ?? new Date(0).toISOString() }
  },

  async saveState(userId, state) {
    localStorage.setItem(stateKey(userId), JSON.stringify(state))
    localStorage.setItem(stateTimeKey(userId), new Date().toISOString())
  },

  async logEvent(event: NewTaskEvent) {
    const events = readEvents()
    events.push({ ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() })
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-1000)))
  },

  async listStudents() {
    return listLocalUsers()
      .filter((u) => u.role === 'student')
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
        state: readState(u.id),
        updatedAt: localStorage.getItem(stateTimeKey(u.id)),
      }))
  },

  async getStudent(id) {
    return (await this.listStudents()).find((s) => s.id === id) ?? null
  },

  async listEvents({ limit = 200, studentId } = {}) {
    return readEvents()
      .filter((e) => !studentId || e.studentId === studentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
  },

  async getNotificationsSeenAt(userId) {
    return localStorage.getItem(SEEN_KEY + userId)
  },

  async markNotificationsSeen(userId) {
    localStorage.setItem(SEEN_KEY + userId, new Date().toISOString())
  },
}
