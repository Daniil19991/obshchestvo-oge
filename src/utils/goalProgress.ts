import type { StudentGoal } from '../types'
import {
  GOAL_EXAM_DATE,
  TOTAL_GOAL_TOPICS,
  formatGoalTaskList,
  goalMockExamTargets,
  goalModuleBlocks,
  goalTaskNumbers,
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
  const topicsDone = goal.completedTopics.length
  const topicsTotal = TOTAL_GOAL_TOPICS
  const topicsPercent = topicsTotal ? Math.round((topicsDone / topicsTotal) * 100) : 0

  const tasksDone = goal.completedTaskNumbers.length
  const tasksTotal = goalTaskNumbers.length
  const tasksPercent = tasksTotal ? Math.round((tasksDone / tasksTotal) * 100) : 0

  const testMet = goal.mockExam.test >= goalMockExamTargets.test
  const writtenMet = goal.mockExam.written >= goalMockExamTargets.written
  const totalMet = goal.mockExam.test + goal.mockExam.written >= goalMockExamTargets.total
  const mockExamMet = testMet && writtenMet && totalMet

  const testProgress = Math.min(100, Math.round((goal.mockExam.test / goalMockExamTargets.test) * 100))
  const writtenProgress = Math.min(
    100,
    Math.round((goal.mockExam.written / goalMockExamTargets.written) * 100),
  )
  const mockExamPercent = Math.round((testProgress + writtenProgress) / 2)

  const overallPercent = Math.round((topicsPercent + tasksPercent + mockExamPercent) / 3)

  const allModulesComplete = goalModuleBlocks.every((block) => {
    const done = goal.completedTopics.filter((id) => id.startsWith(`${block.moduleId}-topic-`)).length
    return done >= block.topicsTotal
  })

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
  return goal.completedTopics.filter((id) => id.startsWith(`${moduleId}-topic-`)).length
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
    `решаю задания ${formatGoalTaskList()}, ` +
    `набрал за пробный экзамен ${total >= goalMockExamTargets.total ? `${total}+` : `${total}/${goalMockExamTargets.total}+`} ` +
    `(${goal.mockExam.test} баллов тест, ${goal.mockExam.written} письменная часть)`
  )
}

export function getDaysUntilExam(examDate: string): number | null {
  if (!examDate) return null
  return Math.max(
    0,
    Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  )
}
