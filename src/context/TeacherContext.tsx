import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { backend, type TaskEvent } from '../lib/backend'
import { useAuth } from './AuthContext'

const POLL_MS = 20000

interface TeacherContextValue {
  events: TaskEvent[]
  seenAt: string | null
  unreadCount: number
  /** свежие события для всплывающих уведомлений */
  toasts: TaskEvent[]
  dismissToast: (id: string) => void
  markAllSeen: () => void
  refresh: () => Promise<void>
  browserNotifications: NotificationPermission | 'unsupported'
  enableBrowserNotifications: () => void
}

const TeacherContext = createContext<TeacherContextValue | null>(null)

export function TeacherProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [events, setEvents] = useState<TaskEvent[]>([])
  const [seenAt, setSeenAt] = useState<string | null>(null)
  const [toasts, setToasts] = useState<TaskEvent[]>([])
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  )
  const knownIds = useRef<Set<string> | null>(null)

  const refresh = useCallback(async () => {
    if (!user) return
    try {
      const list = await backend.listEvents({ limit: 300 })
      setEvents(list)
      const known = knownIds.current
      if (known) {
        const fresh = list.filter((e) => !known.has(e.id))
        if (fresh.length) {
          setToasts((prev) => [...fresh.slice(0, 3), ...prev].slice(0, 4))
          notifyBrowser(fresh)
        }
      }
      knownIds.current = new Set(list.map((e) => e.id))
    } catch {
      // сеть недоступна — попробуем при следующем опросе
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    backend.getNotificationsSeenAt(user.id).then(setSeenAt).catch(() => undefined)
    void refresh()
    const timer = window.setInterval(refresh, POLL_MS)
    // в демо-режиме события из соседней вкладки приходят сразу
    const onStorage = (e: StorageEvent) => e.key === 'obshchestvoznanie-events' && void refresh()
    window.addEventListener('storage', onStorage)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('storage', onStorage)
    }
  }, [user, refresh])

  const markAllSeen = useCallback(() => {
    if (!user) return
    setSeenAt(new Date().toISOString())
    backend.markNotificationsSeen(user.id).catch(() => undefined)
  }, [user])

  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  useEffect(() => {
    if (!toasts.length) return
    const timer = window.setTimeout(() => setToasts((prev) => prev.slice(0, -1)), 7000)
    return () => window.clearTimeout(timer)
  }, [toasts])

  const enableBrowserNotifications = useCallback(() => {
    if (typeof Notification === 'undefined') return
    Notification.requestPermission().then(setPermission)
  }, [])

  const unreadCount = useMemo(
    () => events.filter((e) => !seenAt || e.createdAt > seenAt).length,
    [events, seenAt],
  )

  const value = useMemo(
    () => ({
      events,
      seenAt,
      unreadCount,
      toasts,
      dismissToast,
      markAllSeen,
      refresh,
      browserNotifications: permission,
      enableBrowserNotifications,
    }),
    [events, seenAt, unreadCount, toasts, dismissToast, markAllSeen, refresh, permission, enableBrowserNotifications],
  )

  return <TeacherContext.Provider value={value}>{children}</TeacherContext.Provider>
}

function notifyBrowser(fresh: TaskEvent[]) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const byStudent = new Map<string, TaskEvent[]>()
  for (const e of fresh) byStudent.set(e.studentName, [...(byStudent.get(e.studentName) ?? []), e])
  for (const [name, list] of byStudent) {
    const correct = list.filter((e) => e.correct).length
    try {
      new Notification(`${name} решает задания`, {
        body: `${list[0].slotTitle ?? 'Задания'}: ${list.length} шт., верно ${correct}`,
        tag: `student-${list[0].studentId}`,
      })
    } catch {
      // некоторые браузеры (например, на телефоне) не дают создавать уведомления со страницы
    }
  }
}

export function useTeacher() {
  const ctx = useContext(TeacherContext)
  if (!ctx) throw new Error('useTeacher must be used within TeacherProvider')
  return ctx
}
