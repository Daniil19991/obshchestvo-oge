import type { StudentState } from '../types'
import { GOAL_EXAM_DATE, createEmptyMonthlyMockExams, findTopic, findTopicByLesson } from '../data/goalPlan'

const LEGACY_STORAGE_KEY = 'obshchestvoznanie-student'

function studentKey(userId: string): string {
  return `obshchestvoznanie-student-${userId}`
}

export function createDefaultStudentState(name = 'Ученик'): StudentState {
  const initials = name.trim().split(/\s+/).length >= 2
    ? (name.trim().split(/\s+/)[0][0] + name.trim().split(/\s+/)[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase() || 'УЧ'

  return {
    profile: {
      name,
      grade: 9,
      school: 'Школа №1',
      bio: 'Готовлюсь к ОГЭ по обществознанию',
      joinedAt: new Date().toISOString(),
      avatarInitials: initials,
    },
    goal: {
      examType: 'oge',
      examDate: GOAL_EXAM_DATE,
      completedTopics: [],
      completedTaskNumbers: [],
      completedTaskTypes: [],
      mockExam: { test: 0, written: 0 },
      mockExamByMonth: createEmptyMonthlyMockExams(),
    },
    completedLessons: [],
    practiceHistory: [],
    taskAttempts: [],
    flashcards: {},
    achievements: [
      {
        id: 'start',
        title: 'Первый шаг',
        description: 'Зарегистрировался на платформе',
        icon: '🚀',
        unlockedAt: new Date().toISOString(),
      },
    ],
  }
}

/** @deprecated use createDefaultStudentState */
export const defaultStudentState = createDefaultStudentState()

function migrateGoal(parsed: Partial<StudentState>): StudentState['goal'] {
  const old = parsed.goal as Record<string, unknown> | undefined

  if (old && Array.isArray(old.completedTopics)) {
    return {
      examType: (old.examType as StudentState['goal']['examType']) ?? 'oge',
      examDate: (old.examDate as string) || GOAL_EXAM_DATE,
      completedTopics: old.completedTopics as string[],
      completedTaskNumbers: (old.completedTaskNumbers as number[]) ?? [],
      completedTaskTypes: (old.completedTaskTypes as string[]) ?? [],
      mockExam: {
        test: (old.mockExam as { test?: number })?.test ?? 0,
        written: (old.mockExam as { written?: number })?.written ?? 0,
      },
      mockExamByMonth: {
        ...createEmptyMonthlyMockExams(),
        ...((old.mockExamByMonth as StudentState['goal']['mockExamByMonth']) ?? {}),
      },
    }
  }

  return createDefaultStudentState().goal
}

function parseStudentState(raw: string): StudentState {
  return normalizeStudentState(JSON.parse(raw) as Partial<StudentState>)
}

/** Приводит сохранённое (в т. ч. старое или пришедшее с сервера) состояние к текущему формату. */
export function normalizeStudentState(parsed: Partial<StudentState>): StudentState {
  const base = createDefaultStudentState(parsed.profile?.name)
  const state: StudentState = {
    ...base,
    ...parsed,
    taskAttempts: parsed.taskAttempts ?? [],
    practiceHistory: parsed.practiceHistory ?? [],
    completedLessons: parsed.completedLessons ?? [],
    flashcards: parsed.flashcards ?? {},
    achievements: parsed.achievements ?? base.achievements,
    profile: { ...base.profile, ...parsed.profile },
    goal: migrateGoal(parsed),
  }
  return syncLessonsAndTopics(state)
}

/** Уроки теории и темы цели — одно и то же; выравниваем старые данные. */
function syncLessonsAndTopics(state: StudentState): StudentState {
  const topics = [...state.goal.completedTopics]
  const lessons = [...state.completedLessons]
  for (const lessonId of state.completedLessons) {
    const topic = findTopicByLesson(lessonId)
    if (topic && !topics.includes(topic.id)) topics.push(topic.id)
  }
  for (const topicId of state.goal.completedTopics) {
    const topic = findTopic(topicId)
    if (topic && !lessons.includes(topic.lessonId)) lessons.push(topic.lessonId)
  }
  return { ...state, completedLessons: lessons, goal: { ...state.goal, completedTopics: topics } }
}

function migrateLegacyData(userId: string, userName: string): StudentState | null {
  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (!legacy) return null

  const state = parseStudentState(legacy)
  state.profile.name = state.profile.name === 'Ученик' ? userName : state.profile.name
  saveStudentState(state, userId)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
  return state
}

export function loadStudentState(userId: string, userName: string): StudentState {
  try {
    const raw = localStorage.getItem(studentKey(userId))
    if (!raw) {
      const migrated = migrateLegacyData(userId, userName)
      if (migrated) return migrated
      return createDefaultStudentState(userName)
    }
    return parseStudentState(raw)
  } catch {
    return createDefaultStudentState(userName)
  }
}

export function saveStudentState(state: StudentState, userId: string): void {
  localStorage.setItem(studentKey(userId), JSON.stringify(state))
}
