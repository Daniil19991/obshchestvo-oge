import { flashcards } from '../data/flashcards'
import { getGrade } from '../data/goalPlan'
import { practiceTasks } from '../data/tasks'
import { theoryModules } from '../data/theory'
import type { TaskEvent } from '../lib/backend'
import type { StudentState } from '../types'
import { getGoalProgress, getNextTopic } from './goalProgress'

export interface StudentStats {
  attempts: number
  correct: number
  accuracy: number | null
  solvedTasks: number
  totalTasks: number
  lessonsDone: number
  lessonsTotal: number
  cardsKnown: number
  cardsTotal: number
  mockTotal: number
  mockGrade: number | null
  lastActivity: string | null
  nextTopicTitle: string | null
  goalPercent: number
}

const lessonsTotal = theoryModules.reduce((sum, m) => sum + m.lessons.length, 0)

export function getStudentStats(state: StudentState | null, updatedAt?: string | null): StudentStats {
  if (!state) {
    return {
      attempts: 0,
      correct: 0,
      accuracy: null,
      solvedTasks: 0,
      totalTasks: practiceTasks.length,
      lessonsDone: 0,
      lessonsTotal,
      cardsKnown: 0,
      cardsTotal: flashcards.length,
      mockTotal: 0,
      mockGrade: null,
      lastActivity: updatedAt ?? null,
      nextTopicTitle: null,
      goalPercent: 0,
    }
  }
  const attempts = state.taskAttempts
  const correct = attempts.filter((a) => a.correct).length
  const solved = new Set(attempts.filter((a) => a.taskId).map((a) => a.taskId))
  const mockTotal = state.goal.mockExam.test + state.goal.mockExam.written
  const lastAttempt = attempts.reduce<string | null>((max, a) => (!max || a.date > max ? a.date : max), null)
  return {
    attempts: attempts.length,
    correct,
    accuracy: attempts.length ? Math.round((correct / attempts.length) * 100) : null,
    solvedTasks: solved.size,
    totalTasks: practiceTasks.length,
    lessonsDone: state.completedLessons.length,
    lessonsTotal,
    cardsKnown: Object.values(state.flashcards).filter((s) => s === 'known').length,
    cardsTotal: flashcards.length,
    mockTotal,
    mockGrade: mockTotal > 0 ? getGrade(mockTotal).grade : null,
    lastActivity: [lastAttempt, updatedAt ?? null].filter(Boolean).sort().pop() ?? null,
    nextTopicTitle: getNextTopic(state.goal)?.title ?? null,
    goalPercent: getGoalProgress(state.goal).overallPercent,
  }
}

export function formatRelative(iso: string | null): string {
  if (!iso) return 'ещё не заходил'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'только что'
  if (min < 60) return `${min} мин назад`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} ч назад`
  const d = Math.round(h / 24)
  if (d < 7) return `${d} дн. назад`
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export interface EventGroup {
  key: string
  studentId: string
  studentName: string
  slotTitle: string
  events: TaskEvent[]
  correct: number
  score: number
  maxScore: number
  from: string
  to: string
}

/** Склеивает подряд идущие события одного ученика в одном разделе (с перерывом не больше 30 минут). */
export function groupEvents(events: TaskEvent[]): EventGroup[] {
  const sorted = [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const groups: EventGroup[] = []
  for (const e of sorted) {
    const slotTitle = e.slotTitle ?? 'Задания'
    const last = groups[groups.length - 1]
    const gap = last ? new Date(last.from).getTime() - new Date(e.createdAt).getTime() : Infinity
    if (last && last.studentId === e.studentId && last.slotTitle === slotTitle && gap <= 30 * 60000) {
      last.events.push(e)
      last.from = e.createdAt
      last.correct += e.correct ? 1 : 0
      last.score += e.score
      last.maxScore += e.maxScore
    } else {
      groups.push({
        key: e.id,
        studentId: e.studentId,
        studentName: e.studentName,
        slotTitle,
        events: [e],
        correct: e.correct ? 1 : 0,
        score: e.score,
        maxScore: e.maxScore,
        from: e.createdAt,
        to: e.createdAt,
      })
    }
  }
  return groups
}

export function pluralTasks(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'задание'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'задания'
  return 'заданий'
}
