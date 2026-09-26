import { theoryModules } from './theory'

export const GOAL_EXAM_DATE = '2027-05-25'

export interface GoalTopic {
  id: string
  lessonId: string
  moduleId: string
  number: number
  title: string
}

export interface GoalModuleBlock {
  moduleId: string
  title: string
  topicsTotal: number
  icon: string
  topics: GoalTopic[]
}

/** Блок-модули цели строятся из тем «Теории» — список один на весь сайт. */
export const goalModuleBlocks: GoalModuleBlock[] = theoryModules.map((module) => ({
  moduleId: module.id,
  title: module.title,
  icon: module.icon,
  topicsTotal: module.lessons.length,
  topics: module.lessons.map((lesson, index) => ({
    id: getTopicId(module.id, index + 1),
    lessonId: lesson.id,
    moduleId: module.id,
    number: index + 1,
    title: lesson.title,
  })),
}))

export const allGoalTopics: GoalTopic[] = goalModuleBlocks.flatMap((block) => block.topics)

const topicById = new Map(allGoalTopics.map((t) => [t.id, t]))
const topicByLessonId = new Map(allGoalTopics.map((t) => [t.lessonId, t]))

export function findTopic(topicId: string): GoalTopic | undefined {
  return topicById.get(topicId)
}

export function findTopicByLesson(lessonId: string): GoalTopic | undefined {
  return topicByLessonId.get(lessonId)
}

/** ОГЭ по обществознанию с 2027 года: 20 заданий, максимум 32 балла. */
export const OGE_MAX_SCORE = 32

export interface GradeRange {
  grade: 2 | 3 | 4 | 5
  min: number
  max: number
}

/** Перевод первичных баллов в оценку. */
export const gradeScale: GradeRange[] = [
  { grade: 2, min: 0, max: 11 },
  { grade: 3, min: 12, max: 20 },
  { grade: 4, min: 21, max: 27 },
  { grade: 5, min: 28, max: 32 },
]

export function getGrade(score: number): GradeRange {
  return gradeScale.find((g) => score >= g.min && score <= g.max) ?? gradeScale[gradeScale.length - 1]
}

export const goalMockExamTargets = {
  total: 28,
  grade: 5,
}

export interface WrittenTaskType {
  id: string
  title: string
  icon: string
}

/** Задания письменной части (развёрнутый ответ) — цель: решать их уверенно. */
export const writtenTaskTypes: WrittenTaskType[] = [
  { id: 'concepts', title: 'Знание понятий', icon: '📖' },
  { id: 'photo', title: 'Анализ фотоизображения', icon: '📷' },
  { id: 'finance', title: 'Финансовая грамотность', icon: '💰' },
  { id: 'statistics', title: 'Анализ статистики', icon: '📊' },
  { id: 'case', title: 'Кейс', icon: '🧩' },
  { id: 'text-plan', title: 'План текста', icon: '📝' },
  { id: 'text-questions', title: 'Вопросы по тексту', icon: '❓' },
  { id: 'arguments', title: 'Аргументация', icon: '💬' },
]

export const MOCK_EXAM_CHART_MAX = OGE_MAX_SCORE

export const mockExamMonths = [
  { id: 'sep', label: 'Сен', fullLabel: 'Сентябрь' },
  { id: 'oct', label: 'Окт', fullLabel: 'Октябрь' },
  { id: 'nov', label: 'Ноя', fullLabel: 'Ноябрь' },
  { id: 'dec', label: 'Дек', fullLabel: 'Декабрь' },
  { id: 'jan', label: 'Янв', fullLabel: 'Январь' },
  { id: 'feb', label: 'Фев', fullLabel: 'Февраль' },
  { id: 'mar', label: 'Мар', fullLabel: 'Март' },
  { id: 'apr', label: 'Апр', fullLabel: 'Апрель' },
  { id: 'may', label: 'Май', fullLabel: 'Май' },
] as const

export type MockExamMonthId = (typeof mockExamMonths)[number]['id']

export function createEmptyMonthlyMockExams(): Record<MockExamMonthId, { test: number; written: number }> {
  return Object.fromEntries(
    mockExamMonths.map((m) => [m.id, { test: 0, written: 0 }]),
  ) as Record<MockExamMonthId, { test: number; written: number }>
}

export const TOTAL_GOAL_TOPICS = goalModuleBlocks.reduce((sum, m) => sum + m.topicsTotal, 0)

export function getTopicId(moduleId: string, index: number): string {
  return `${moduleId}-topic-${index}`
}

export function getModuleTopics(moduleId: string, topicsTotal: number): string[] {
  return Array.from({ length: topicsTotal }, (_, i) => getTopicId(moduleId, i + 1))
}
