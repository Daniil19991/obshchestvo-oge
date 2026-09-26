import { writtenTaskTypes } from '../data/goalPlan'
import { practiceTasks } from '../data/tasks'
import { theoryModules } from '../data/theory'
import type { PracticeTask, TaskAttempt } from '../types'
import { shuffle } from './flashcards'

export type SessionMode = 'practice' | 'exam'

export interface SessionSpec {
  title: string
  subtitle?: string
  mode: SessionMode
  slotId: string
  moduleId: string
  tasks: PracticeTask[]
}

export function getModuleTasks(moduleId: string, format?: PracticeTask['format']): PracticeTask[] {
  return practiceTasks.filter((t) => t.moduleId === moduleId && (!format || t.format === format))
}

export function getKindTasks(kind: string): PracticeTask[] {
  return practiceTasks.filter((t) => t.kind === kind)
}

export function getKindTitle(kind?: string): string {
  return writtenTaskTypes.find((t) => t.id === kind)?.title ?? 'Письменная часть'
}

export function getKindIcon(kind?: string): string {
  return writtenTaskTypes.find((t) => t.id === kind)?.icon ?? '✍️'
}

export function getModuleTitle(moduleId: string): string {
  return theoryModules.find((m) => m.id === moduleId)?.title ?? ''
}

export function getModuleIcon(moduleId: string): string {
  return theoryModules.find((m) => m.id === moduleId)?.icon ?? '📘'
}

/** Задания, последняя попытка по которым была неверной. */
export function getErrorTasks(attempts: TaskAttempt[]): PracticeTask[] {
  const last = new Map<string, TaskAttempt>()
  for (const a of attempts) if (a.taskId) last.set(a.taskId, a)
  return practiceTasks.filter((t) => last.get(t.id)?.correct === false)
}

/** Пробный вариант: 12 тестовых (по 2 из каждого модуля) + 8 письменных (по одному каждого типа). */
export function buildExamVariant(): PracticeTask[] {
  const test = theoryModules.flatMap((m) => shuffle(getModuleTasks(m.id, 'test')).slice(0, 2))
  const written = writtenTaskTypes
    .map((type) => shuffle(getKindTasks(type.id))[0])
    .filter((t): t is PracticeTask => Boolean(t))
  return [...shuffle(test), ...written]
}

export function buildMarathon(count: number): PracticeTask[] {
  return shuffle(practiceTasks).slice(0, count)
}

/** Разбор параметров адреса /practice/session?... в набор заданий. */
export function resolveSession(params: URLSearchParams, attempts: TaskAttempt[]): SessionSpec | null {
  const module = params.get('module')
  const format = params.get('format') as PracticeTask['format'] | null
  const kind = params.get('kind')
  const mode = params.get('mode')

  if (module) {
    const tasks = getModuleTasks(module, format ?? undefined)
    const part = format === 'test' ? 'Тестовая часть' : format === 'written' ? 'Письменная часть' : 'Все задания'
    return {
      title: getModuleTitle(module),
      subtitle: part,
      mode: 'practice',
      slotId: `${format === 'written' ? 'written' : 'short'}-${module}`,
      moduleId: module,
      tasks,
    }
  }
  if (kind) {
    return {
      title: getKindTitle(kind),
      subtitle: 'Письменная часть',
      mode: 'practice',
      slotId: `written-${kind}`,
      moduleId: 'mixed',
      tasks: getKindTasks(kind),
    }
  }
  if (mode === 'marathon') {
    const n = Number(params.get('n')) || 20
    return { title: 'Марафон', subtitle: `${n} заданий вперемешку`, mode: 'practice', slotId: 'marathon', moduleId: 'mixed', tasks: buildMarathon(n) }
  }
  if (mode === 'errors') {
    return { title: 'Работа над ошибками', subtitle: 'Задания, в которых была ошибка', mode: 'practice', slotId: 'errors', moduleId: 'mixed', tasks: getErrorTasks(attempts) }
  }
  if (mode === 'exam') {
    return { title: 'Пробный вариант ОГЭ', subtitle: '20 заданий · 3 часа · максимум 32 балла', mode: 'exam', slotId: 'exam', moduleId: 'mixed', tasks: buildExamVariant() }
  }
  return null
}

export function sourceUrl(task: PracticeTask): string {
  return `https://soc-oge.sdamgia.ru/problem?id=${task.sourceId}`
}
