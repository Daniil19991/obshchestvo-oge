import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { useTeacher } from '../../context/TeacherContext'
import { backend, type StudentSummary } from '../../lib/backend'
import { formatRelative, getStudentStats } from '../../utils/studentStats'

type SortKey = 'activity' | 'name' | 'accuracy' | 'solved'

export function TeacherDashboardPage() {
  const { events } = useTeacher()
  const [students, setStudents] = useState<StudentSummary[] | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('activity')

  useEffect(() => {
    backend
      .listStudents()
      .then(setStudents)
      .catch((e: Error) => setError(e.message))
    // обновляем список, когда приходят новые решения
  }, [events.length])

  const rows = useMemo(() => {
    const list = (students ?? []).map((s) => ({ student: s, stats: getStudentStats(s.state, s.updatedAt) }))
    const q = query.trim().toLowerCase()
    const filtered = q ? list.filter((r) => `${r.student.name} ${r.student.email}`.toLowerCase().includes(q)) : list
    const by: Record<SortKey, (a: (typeof list)[number], b: (typeof list)[number]) => number> = {
      activity: (a, b) => (b.stats.lastActivity ?? '').localeCompare(a.stats.lastActivity ?? ''),
      name: (a, b) => a.student.name.localeCompare(b.student.name, 'ru'),
      accuracy: (a, b) => (b.stats.accuracy ?? -1) - (a.stats.accuracy ?? -1),
      solved: (a, b) => b.stats.solvedTasks - a.stats.solvedTasks,
    }
    return filtered.sort(by[sort])
  }, [students, query, sort])

  const today = new Date().toDateString()
  const todayEvents = events.filter((e) => new Date(e.createdAt).toDateString() === today)
  const activeToday = new Set(todayEvents.map((e) => e.studentId)).size
  const accuracyToday = todayEvents.length
    ? Math.round((todayEvents.filter((e) => e.correct).length / todayEvents.length) * 100)
    : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Мои ученики</h1>
        <p className="text-muted mt-2">Прогресс всех учеников, зарегистрированных на сайте</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <Stat value={students?.length ?? '—'} label="учеников" />
        <Stat value={activeToday} label="занимались сегодня" />
        <Stat value={todayEvents.length} label="заданий решено сегодня" />
        <Stat value={accuracyToday === null ? '—' : `${accuracyToday}%`} label="верных ответов сегодня" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по имени или email…"
          className="min-w-0 flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm"
        >
          <option value="activity">Сначала активные</option>
          <option value="name">По имени</option>
          <option value="accuracy">По точности</option>
          <option value="solved">По числу решённых</option>
        </select>
      </div>

      {error && <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">Не удалось загрузить учеников: {error}</div>}

      {students === null && !error && <p className="text-muted">Загрузка…</p>}

      {students !== null && rows.length === 0 && (
        <EmptyState
          icon="🧑‍🎓"
          title={students.length ? 'Никого не нашли' : 'Учеников пока нет'}
          description={
            students.length
              ? 'Измените поисковый запрос.'
              : 'Когда ученики зарегистрируются на сайте, они появятся здесь.'
          }
        />
      )}

      <div className="grid gap-3">
        {rows.map(({ student, stats }) => (
          <Link key={student.id} to={`/teacher/students/${student.id}`}>
            <Card hover className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white font-bold">
                  {initials(student.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">{student.name}</div>
                  <div className="text-xs text-muted truncate">
                    {student.email} · был(а) {formatRelative(stats.lastActivity)}
                  </div>
                  {stats.nextTopicTitle && (
                    <div className="mt-1 text-xs text-slate-500 truncate">Следующая тема: {stats.nextTopicTitle}</div>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs sm:gap-4">
                  <Metric value={`${stats.solvedTasks}/${stats.totalTasks}`} label="заданий" />
                  <Metric
                    value={stats.accuracy === null ? '—' : `${stats.accuracy}%`}
                    label="верно"
                    tone={stats.accuracy === null ? undefined : stats.accuracy >= 70 ? 'good' : stats.accuracy >= 50 ? 'mid' : 'bad'}
                  />
                  <Metric value={`${stats.lessonsDone}/${stats.lessonsTotal}`} label="тем" />
                  <Metric
                    value={stats.mockGrade === null ? '—' : `«${stats.mockGrade}»`}
                    label={stats.mockGrade === null ? 'пробник' : `${stats.mockTotal} б.`}
                  />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <Card className="p-4">
      <div className="text-2xl font-bold text-ink sm:text-3xl">{value}</div>
      <div className="text-sm text-muted mt-0.5">{label}</div>
    </Card>
  )
}

function Metric({ value, label, tone }: { value: string; label: string; tone?: 'good' | 'mid' | 'bad' }) {
  const color = tone === 'good' ? 'text-emerald-600' : tone === 'mid' ? 'text-amber-600' : tone === 'bad' ? 'text-rose-600' : 'text-slate-900'
  return (
    <div className="min-w-14">
      <div className={`text-base font-bold ${color}`}>{value}</div>
      <div className="text-muted">{label}</div>
    </div>
  )
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'УЧ'
}
