import type { StudentGoal } from '../types'
import type { GoalTopic } from '../data/goalPlan'
import {
  GOAL_EXAM_DATE,
  TOTAL_GOAL_TOPICS,
  allGoalTopics,
  findTopic,
  goalMockExamTargets,
  goalModuleBlocks,
  getGrade,
  writtenTaskTypes,
} from '../data/goalPlan'

export interface GoalProgress {
  topicsDone: number
  topicsTotal: number
  topicsPercent: number
  tasksDone: number
  tasksTotal: number
  tasksPercent: number
  mockExamMet: boolean
  mockExamPercent: number
  overallPercent: number
  allModulesComplete: boolean
  allTasksComplete: boolean
}

export function getGoalProgress(goal: StudentGoal): GoalProgress {
  const topicsDone = goal.completedTopics.filter((id) => findTopic(id)).length
  const topicsTotal = TOTAL_GOAL_TOPICS
  const topicsPercent = topicsTotal ? Math.round((topicsDone / topicsTotal) * 100) : 0

  const validTaskIds = new Set(writtenTaskTypes.map((t) => t.id))
  const tasksDone = goal.completedTaskTypes.filter((id) => validTaskIds.has(id)).length
  const tasksTotal = writtenTaskTypes.length
  const tasksPercent = tasksTotal ? Math.round((tasksDone / tasksTotal) * 100) : 0

  const mockTotal = goal.mockExam.test + goal.mockExam.written
  const mockExamMet = mockTotal >= goalMockExamTargets.total
  const mockExamPercent = Math.min(100, Math.round((mockTotal / goalMockExamTargets.total) * 100))

  const overallPercent = Math.round((topicsPercent + tasksPercent + mockExamPercent) / 3)

  const allModulesComplete = goalModuleBlocks.every(
    (block) => getModuleTopicProgress(goal, block.moduleId) >= block.topicsTotal,
  )

  const allTasksComplete = tasksDone >= tasksTotal

  return {
    topicsDone,
    topicsTotal,
    topicsPercent,
    tasksDone,
    tasksTotal,
    tasksPercent,
    mockExamMet,
    mockExamPercent,
    overallPercent,
    allModulesComplete,
    allTasksComplete,
  }
}

export function getModuleTopicProgress(goal: StudentGoal, moduleId: string): number {
  return goal.completedTopics.filter((id) => findTopic(id)?.moduleId === moduleId).length
}

/**
 * Следующая тема по расписанию.
 * Берём последнюю отмеченную тему и идём дальше по её модулю;
 * если модуль закончен — первая неизученная тема в следующих модулях.
 */
export function getNextTopic(goal: StudentGoal): GoalTopic | null {
  const done = new Set(goal.completedTopics)
  const isOpen = (t: GoalTopic) => !done.has(t.id)

  const last = [...goal.completedTopics].reverse().map(findTopic).find(Boolean)
  if (!last) return allGoalTopics.find(isOpen) ?? null

  const blockIndex = goalModuleBlocks.findIndex((b) => b.moduleId === last.moduleId)
  const block = goalModuleBlocks[blockIndex]

  const afterInModule = block.topics.filter((t) => t.number > last.number).find(isOpen)
  if (afterInModule) return afterInModule
  const earlierInModule = block.topics.find(isOpen)
  if (earlierInModule) return earlierInModule

  for (let step = 1; step < goalModuleBlocks.length; step++) {
    const next = goalModuleBlocks[(blockIndex + step) % goalModuleBlocks.length].topics.find(isOpen)
    if (next) return next
  }
  return null
}

export function buildGoalSummary(goal: StudentGoal): string {
  const date = new Date(goal.examDate || GOAL_EXAM_DATE).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const modulesText = goalModuleBlocks
    .map((block) => {
      const done = getModuleTopicProgress(goal, block.moduleId)
      return `${block.title} ${done}/${block.topicsTotal}`
    })
    .join(', ')

  const total = goal.mockExam.test + goal.mockExam.written

  return (
    `К ${date} знаю все блок-модули (${modulesText}), ` +
    `уверенно решаю задания письменной части, ` +
    `набрал за пробный экзамен ${total} из ${goalMockExamTargets.total}+ (оценка «${getGrade(total).grade}»)`
  )
}

export function getDaysUntilExam(examDate: string): number | null {
  if (!examDate) return null
  return Math.max(
    0,
    Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  )
}
