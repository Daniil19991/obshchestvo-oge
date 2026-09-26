import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '../../components/Card'
import { ModuleRadarChart } from '../../components/ModuleRadarChart'
import { ProgressRing } from '../../components/ProgressRing'
import { useTeacher } from '../../context/TeacherContext'
import { getCardsForModule } from '../../utils/flashcards'
import { getGrade, mockExamMonths, writtenTaskTypes } from '../../data/goalPlan'
import { practiceTasks } from '../../data/tasks'
import { theoryModules } from '../../data/theory'
import { backend, type StudentSummary, type TaskEvent } from '../../lib/backend'
import { getGoalProgress } from '../../utils/goalProgress'
import { calculateModuleMastery } from '../../utils/moduleMastery'
import { formatDateTime, formatRelative, getStudentStats } from '../../utils/studentStats'
import { getKindTitle } from '../../utils/tasks'
import { initials } from './TeacherDashboardPage'

const taskById = new Map(practiceTasks.map((t) => [t.id, t]))

export function TeacherStudentPage() {
  const { studentId = '' } = useParams()
  const { events: allEvents } = useTeacher()
  const [student, setStudent] = useState<StudentSummary | null | undefined>(undefined)
  const [events, setEvents] = useState<TaskEvent[]>([])

  useEffect(() => {
    backend.getStudent(studentId).then(setStudent).catch(() => setStudent(null))
    backend.listEvents({ studentId, limit: 100 }).then(setEvents).catch(() => undefined)
  }, [studentId, allEvents.length])

  if (student === undefined) return <div className="mx-auto max-w-6xl px-4 py-10 text-muted">Загрузка…</div>
  if (student === null)
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link to="/teacher" className="text-sm text-brand-600">← Все ученики</Link>
        <p className="mt-6 text-muted">Ученик не найден.</p>
      </div>
    )

  const state = student.state
  const stats = getStudentStats(state, student.updatedAt)
  const mastery = state ? calculateModuleMastery(state) : []
  const goal = state ? getGoalProgress(state.goal) : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link to="/teacher" className="text-sm font-medium text-brand-600 hover:text-brand-700">← Все ученики</Link>

      <div className="mt-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white">
          {initials(student.name)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">{student.name}</h1>
          <p className="text-sm text-muted">
            {student.email} · {state ? `${state.profile.grade} класс · ${state.profile.school}` : 'ещё не открывал сайт'} ·
            был(а) {formatRelative(stats.lastActivity)}
          </p>
        </div>
      </div>

      {!state ? (
        <Card className="p-6 text-muted">Ученик зарегистрировался, но ещё не занимался — данных пока нет.</Card>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
            <Tile value={`${stats.solvedTasks}`} label={`заданий решено из ${stats.totalTasks}`} />
            <Tile value={stats.accuracy === null ? '—' : `${stats.accuracy}%`} label={`верных ответов (${stats.correct} из ${stats.attempts})`} />
            <Tile value={`${stats.lessonsDone}/${stats.lessonsTotal}`} label="тем изучено" />
            <Tile value={`${stats.cardsKnown}/${stats.cardsTotal}`} label="понятий выучено" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <Card>
              <h2 className="font-semibold text-slate-900 text-lg mb-1">Усвоение модулей</h2>
              <p className="text-sm text-muted mb-6">Уроки теории и верные ответы по каждому модулю</p>
              <div className="flex justify-center">
                <ModuleRadarChart data={mastery} size={360} />
              </div>
            </Card>

            <Card>
              <h2 className="font-semibold text-slate-900 text-lg mb-4">Цель: «5» на ОГЭ</h2>
              {goal && (
                <div className="flex flex-wrap justify-center gap-4 mb-5">
                  <ProgressRing value={goal.topicsPercent} label="темы" />
                  <ProgressRing value={goal.tasksPercent} label="письм. часть" />
                  <ProgressRing value={goal.mockExamPercent} label="пробник" />
                </div>
              )}
              <div className="text-sm text-slate-700 space-y-1.5">
                <div>
                  <span className="text-muted">Последний пробник:</span>{' '}
                  <strong>{stats.mockTotal} из 32</strong>
                  {stats.mockGrade !== null && <> — оценка «{stats.mockGrade}»</>}
                </div>
                <div>
                  <span className="text-muted">Следующая тема:</span> {stats.nextTopicTitle ?? 'все темы изучены'}
                </div>
                <div>
                  <span className="text-muted">Письменная часть уверенно:</span>{' '}
                  {writtenTaskTypes.filter((t) => state.goal.completedTaskTypes.includes(t.id)).map((t) => t.title).join(', ') || 'пока ничего не отмечено'}
                </div>
              </div>
              <MockMonths state={state} />
            </Card>
          </div>

          <Card className="mb-6 overflow-x-auto">
            <h2 className="font-semibold text-slate-900 text-lg mb-4">По модулям</h2>
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="pb-2 font-semibold">Модуль</th>
                  <th className="pb-2 font-semibold">Темы</th>
                  <th className="pb-2 font-semibold">Задания</th>
                  <th className="pb-2 font-semibold">Верно</th>
                  <th className="pb-2 font-semibold">Понятия</th>
                </tr>
              </thead>
              <tbody>
                {theoryModules.map((m) => {
                  const attempts = state.taskAttempts.filter((a) => a.moduleId === m.id)
                  const correct = attempts.filter((a) => a.correct).length
                  const lessons = m.lessons.filter((l) => state.completedLessons.includes(l.id)).length
                  const cards = getCardsForModule(m.id)
                  const known = cards.filter((c) => state.flashcards[c.id] === 'known').length
                  const acc = attempts.length ? Math.round((correct / attempts.length) * 100) : null
                  return (
                    <tr key={m.id} className="border-t border-border">
                      <td className="py-2.5 font-medium text-slate-900">
                        {m.icon} {m.title}
                      </td>
                      <td className="py-2.5">{lessons}/{m.lessons.length}</td>
                      <td className="py-2.5">{attempts.length}</td>
                      <td className={`py-2.5 font-semibold ${acc === null ? 'text-muted' : acc >= 70 ? 'text-emerald-600' : acc >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {acc === null ? '—' : `${acc}%`}
                      </td>
                      <td className="py-2.5">{known}/{cards.length}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}

      <Card>
        <h2 className="font-semibold text-slate-900 text-lg mb-4">Последние решения</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted">Пока нет решённых заданий.</p>
        ) : (
          <div className="divide-y divide-border">
            {events.slice(0, 40).map((e) => {
              const task = taskById.get(e.taskId)
              return (
                <div key={e.id} className="flex items-start gap-3 py-3">
                  <span
                    className={`mt-0.5 flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg px-1.5 text-xs font-bold ${
                      e.correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {e.score}/{e.maxScore}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-slate-900 line-clamp-2">{task?.text ?? e.taskId}</div>
                    <div className="text-xs text-muted mt-0.5">
                      {e.format === 'written' ? `${getKindTitle(e.kind)} · самооценка` : 'Тест'} · {e.slotTitle ?? ''} ·{' '}
                      {formatDateTime(e.createdAt)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <Card className="p-4">
      <div className="text-2xl font-bold text-ink sm:text-3xl">{value}</div>
      <div className="text-sm text-muted mt-0.5">{label}</div>
    </Card>
  )
}

function MockMonths({ state }: { state: NonNullable<StudentSummary['state']> }) {
  const months = mockExamMonths
    .map((m) => ({ ...m, s: state.goal.mockExamByMonth[m.id] }))
    .filter((m) => m.s && m.s.test + m.s.written > 0)
  if (!months.length) return null
  return (
    <div className="mt-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Пробники по месяцам</div>
      <div className="flex flex-wrap gap-2">
        {months.map((m) => {
          const total = m.s!.test + m.s!.written
          return (
            <span key={m.id} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {m.label}: {total} б. («{getGrade(total).grade}»)
            </span>
          )
        })}
      </div>
    </div>
  )
}
