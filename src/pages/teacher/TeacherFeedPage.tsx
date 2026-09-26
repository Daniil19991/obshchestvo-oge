import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { useTeacher } from '../../context/TeacherContext'
import { backend } from '../../lib/backend'
import { formatDateTime, groupEvents, pluralTasks } from '../../utils/studentStats'

export function TeacherFeedPage() {
  const { events, seenAt, markAllSeen, unreadCount, browserNotifications, enableBrowserNotifications } = useTeacher()
  // запоминаем, что было непрочитанным в момент открытия, чтобы подсветка не пропала сразу
  const [openedSeenAt] = useState(seenAt)
  const groups = useMemo(() => groupEvents(events), [events])

  useEffect(() => {
    if (unreadCount > 0) {
      const timer = window.setTimeout(markAllSeen, 1500)
      return () => window.clearTimeout(timer)
    }
  }, [unreadCount, markAllSeen])

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">Уведомления</h1>
          <p className="text-muted mt-1">Кто и что решал на сайте. Обновляется каждые 20 секунд.</p>
        </div>
        {browserNotifications === 'default' && (
          <button
            type="button"
            onClick={enableBrowserNotifications}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            🔔 Включить уведомления в браузере
          </button>
        )}
        {browserNotifications === 'granted' && (
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
            🔔 Уведомления в браузере включены
          </span>
        )}
      </div>

      {browserNotifications === 'denied' && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Уведомления в браузере запрещены. Их можно разрешить в настройках сайта (значок замка в адресной строке).
        </div>
      )}

      {backend.mode === 'local' && (
        <div className="mb-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
          Демо-режим: здесь видны решения учеников, которые занимались в этом же браузере.
        </div>
      )}

      {groups.length === 0 ? (
        <EmptyState icon="🔔" title="Пока тихо" description="Когда ученики начнут решать задания, здесь появятся уведомления." />
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const unread = !openedSeenAt || g.to > openedSeenAt
            const n = g.events.length
            const pct = Math.round((g.score / g.maxScore) * 100)
            return (
              <Link key={g.key} to={`/teacher/students/${g.studentId}`}>
                <Card hover className={`p-4 ${unread ? 'border-brand-200 bg-brand-50/40' : ''}`}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${unread ? 'bg-brand-500' : 'bg-transparent'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-slate-900">
                        <strong>{g.studentName}</strong> решил(а) {n} {pluralTasks(n)}
                      </div>
                      <div className="text-sm text-muted truncate">{g.slotTitle}</div>
                      <div className="mt-1 text-xs text-muted">{formatDateTime(g.to)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {g.correct}/{n}
                      </div>
                      <div className="text-xs text-muted">верно</div>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
