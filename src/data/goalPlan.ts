export const GOAL_EXAM_DATE = '2027-05-25'

export interface GoalModuleBlock {
  moduleId: string
  title: string
  topicsTotal: number
  icon: string
}

export const goalModuleBlocks: GoalModuleBlock[] = [
  { moduleId: 'human-society', title: 'Человек и общество', topicsTotal: 11, icon: '👤' },
  { moduleId: 'spiritual-life', title: 'Духовная культура', topicsTotal: 6, icon: '🎭' },
  { moduleId: 'social-relations', title: 'Социальная сфера', topicsTotal: 7, icon: '👨‍👩‍👧' },
  { moduleId: 'economics', title: 'Экономика', topicsTotal: 13, icon: '📊' },
  { moduleId: 'politics', title: 'Политика', topicsTotal: 8, icon: '🏛️' },
  { moduleId: 'law', title: 'Право', topicsTotal: 11, icon: '⚖️' },
]

export const goalTaskNumbers = [1, 5, 6, 12, 21, 22, 23, 24] as const

export const goalMockExamTargets = {
  total: 32,
  test: 15,
  written: 17,
}

export const MOCK_EXAM_CHART_MAX = 37

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

export function formatGoalTaskList(): string {
  const nums = [...goalTaskNumbers]
  const parts: string[] = []
  let rangeStart = nums[0]
  let rangeEnd = nums[0]

  for (let i = 1; i <= nums.length; i++) {
    if (i < nums.length && nums[i] === rangeEnd + 1) {
      rangeEnd = nums[i]
    } else {
      parts.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}–${rangeEnd}`)
      if (i < nums.length) {
        rangeStart = nums[i]
        rangeEnd = nums[i]
      }
    }
  }
  return parts.join(', ')
}
