import type { ModuleMastery, StudentState } from '../types'
import { theoryModules } from '../data/theory'

/** Все уроки модуля вместе дают до 60%, остальное — задания. */
const LESSONS_MAX = 60
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

    const value = Math.round(clamp(
      (module.lessons.length ? (lessonsDone / module.lessons.length) * LESSONS_MAX : 0) +
        correctTasks * CORRECT_TASK_BOOST -
        incorrectTasks * INCORRECT_TASK_PENALTY,
    ))

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
  lesson: `уроки модуля — до ${LESSONS_MAX}%`,
  correct: `+${CORRECT_TASK_BOOST}% за верный ответ`,
  incorrect: `−${INCORRECT_TASK_PENALTY}% за ошибку`,
}
