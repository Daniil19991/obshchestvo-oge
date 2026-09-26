import type { ModuleMastery, StudentState } from '../types'
import { theoryModules } from '../data/theory'

const LESSON_BOOST = 12
const CORRECT_TASK_BOOST = 8
const INCORRECT_TASK_PENALTY = 6

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value))
}

export function calculateModuleMastery(state: StudentState): ModuleMastery[] {
  return theoryModules.map((module) => {
    const lessonsDone = module.lessons.filter((lesson) =>
      state.completedLessons.includes(lesson.id),
    ).length

    const moduleAttempts = state.taskAttempts.filter((a) => a.moduleId === module.id)
    const correctTasks = moduleAttempts.filter((a) => a.correct).length
    const incorrectTasks = moduleAttempts.filter((a) => !a.correct).length

    const value = clamp(
      lessonsDone * LESSON_BOOST +
        correctTasks * CORRECT_TASK_BOOST -
        incorrectTasks * INCORRECT_TASK_PENALTY,
    )

    return {
      moduleId: module.id,
      title: module.title,
      icon: module.icon,
      value,
      lessonsDone,
      lessonsTotal: module.lessons.length,
      correctTasks,
      incorrectTasks,
    }
  })
}

export const MASTERY_LEGEND = {
  lesson: `+${LESSON_BOOST}% за урок`,
  correct: `+${CORRECT_TASK_BOOST}% за верный ответ`,
  incorrect: `−${INCORRECT_TASK_PENALTY}% за ошибку`,
}
