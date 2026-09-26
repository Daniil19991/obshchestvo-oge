import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { findTopic, findTopicByLesson } from '../data/goalPlan'
import { theoryModules } from '../data/theory'
import type { FlashcardStatus, MockExamScores, PracticeRecord, ModuleMastery, StudentGoal, StudentProfile, StudentState } from '../types'
import { calculateModuleMastery } from '../utils/moduleMastery'
import { createDefaultStudentState, loadStudentState, saveStudentState } from '../utils/storage'
import { useAuth } from './AuthContext'
import { backend } from '../lib/backend'

export interface AttemptExtra {
  taskId?: string
  score?: number
  maxScore?: number
  slotTitle?: string
  format?: 'test' | 'written'
  kind?: string
}

interface StudentContextValue {
  state: StudentState
  updateProfile: (profile: Partial<StudentProfile>) => void
  updateGoal: (goal: Partial<StudentGoal>) => void
  toggleGoalTopic: (topicId: string) => void
  toggleGoalTask: (taskTypeId: string) => void
  updateMockExam: (scores: Partial<MockExamScores>) => void
  updateMonthlyMockExam: (monthId: string, scores: Partial<MockExamScores>) => void
  toggleLesson: (lessonId: string) => void
  recordTaskAttempt: (moduleId: string, correct: boolean, slotId?: string, extra?: AttemptExtra) => void
  addPracticeRecord: (record: Omit<PracticeRecord, 'id' | 'date'>) => void
  setFlashcardStatus: (cardId: string, status: FlashcardStatus | null) => void
  resetFlashcards: (cardIds: string[]) => void
  totalLessons: number
  completedLessonsCount: number
  theoryProgress: number
  moduleMastery: ModuleMastery[]
}

const StudentContext = createContext<StudentContextValue | null>(null)

export function StudentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<StudentState>(() =>
    user ? loadStudentState(user.id, user.name) : createDefaultStudentState(),
  )
  // Пока прогресс не загружен с сервера, на сервер ничего не отправляем — чтобы не затереть его локальной копией
  const [hydrated, setHydrated] = useState(false)
  const userRef = useRef(user)
  const nameRef = useRef(state.profile.name)
  useEffect(() => {
    userRef.current = user
    nameRef.current = state.profile.name
  }, [user, state.profile.name])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setHydrated(false)
    setState(loadStudentState(user.id, user.name))
    backend
      .loadState(user.id)
      .then((remote) => {
        if (!cancelled && remote) setState(remote.state)
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setHydrated(true))
    return () => {
      cancelled = true
    }
  }, [user?.id, user?.name])

  useEffect(() => {
    if (!user) return
    saveStudentState(state, user.id)
    if (!hydrated || backend.mode === 'local') return
    const timer = window.setTimeout(() => {
      backend.saveState(user.id, state).catch(() => undefined)
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [state, user?.id, hydrated])

  const totalLessons = useMemo(
    () => theoryModules.reduce((sum, module) => sum + module.lessons.length, 0),
    [],
  )

  const completedLessonsCount = state.completedLessons.length

  const theoryProgress = totalLessons
    ? Math.round((completedLessonsCount / totalLessons) * 100)
    : 0

  const moduleMastery = useMemo(() => calculateModuleMastery(state), [state])

  const updateProfile = useCallback((profile: Partial<StudentProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        ...profile,
        avatarInitials: getInitials(profile.name ?? prev.profile.name),
      },
    }))
  }, [])

  const updateGoal = useCallback((goal: Partial<StudentGoal>) => {
    setState((prev) => ({
      ...prev,
      goal: { ...prev.goal, ...goal },
    }))
  }, [])

  const toggleGoalTopic = useCallback((topicId: string) => {
    const lessonId = findTopic(topicId)?.lessonId
    setState((prev) => {
      const done = !prev.goal.completedTopics.includes(topicId)
      return withTheoryAchievements(applyTopicDone(prev, topicId, lessonId, done), totalLessons)
    })
  }, [totalLessons])

  const toggleGoalTask = useCallback((taskTypeId: string) => {
    setState((prev) => {
      const current = prev.goal.completedTaskTypes
      const completed = current.includes(taskTypeId)
        ? current.filter((id) => id !== taskTypeId)
        : [...current, taskTypeId]
      return {
        ...prev,
        goal: { ...prev.goal, completedTaskTypes: completed },
      }
    })
  }, [])

  const updateMockExam = useCallback((scores: Partial<MockExamScores>) => {
    setState((prev) => ({
      ...prev,
      goal: {
        ...prev.goal,
        mockExam: { ...prev.goal.mockExam, ...scores },
      },
    }))
  }, [])

  const updateMonthlyMockExam = useCallback((monthId: string, scores: Partial<MockExamScores>) => {
    setState((prev) => ({
      ...prev,
      goal: {
        ...prev.goal,
        mockExamByMonth: {
          ...prev.goal.mockExamByMonth,
          [monthId]: {
            ...prev.goal.mockExamByMonth[monthId],
            test: prev.goal.mockExamByMonth[monthId]?.test ?? 0,
            written: prev.goal.mockExamByMonth[monthId]?.written ?? 0,
            ...scores,
          },
        },
      },
    }))
  }, [])

  const toggleLesson = useCallback((lessonId: string) => {
    const topicId = findTopicByLesson(lessonId)?.id
    setState((prev) => {
      const done = !prev.completedLessons.includes(lessonId)
      const next = topicId
        ? applyTopicDone(prev, topicId, lessonId, done)
        : {
            ...prev,
            completedLessons: done
              ? [...prev.completedLessons, lessonId]
              : prev.completedLessons.filter((id) => id !== lessonId),
          }
      return withTheoryAchievements(next, totalLessons)
    })
  }, [totalLessons])

  const recordTaskAttempt = useCallback(
    (moduleId: string, correct: boolean, slotId?: string, extra?: AttemptExtra) => {
      const { slotTitle, format, kind, ...attemptExtra } = extra ?? {}
      const u = userRef.current
      if (u && extra?.taskId) {
        // уведомление учителю
        backend
          .logEvent({
            studentId: u.id,
            studentName: nameRef.current || u.name,
            taskId: extra.taskId,
            moduleId,
            format: format ?? 'test',
            kind,
            slotTitle,
            score: extra.score ?? (correct ? 1 : 0),
            maxScore: extra.maxScore ?? 1,
            correct,
          })
          .catch(() => undefined)
      }
      setState((prev) => ({
        ...prev,
        taskAttempts: [
          ...prev.taskAttempts,
          {
            id: crypto.randomUUID(),
            moduleId,
            slotId,
            correct,
            date: new Date().toISOString(),
            ...attemptExtra,
          },
        ],
      }))
    },
    [],
  )

  const addPracticeRecord = useCallback((record: Omit<PracticeRecord, 'id' | 'date'>) => {
    setState((prev) => ({
      ...prev,
      practiceHistory: [
        ...prev.practiceHistory,
        { ...record, id: crypto.randomUUID(), date: new Date().toISOString() },
      ],
    }))
  }, [])

  const setFlashcardStatus = useCallback((cardId: string, status: FlashcardStatus | null) => {
    setState((prev) => {
      const flashcards = { ...prev.flashcards }
      if (status) flashcards[cardId] = status
      else delete flashcards[cardId]

      const achievements = [...prev.achievements]
      const knownCount = Object.values(flashcards).filter((s) => s === 'known').length
      if (knownCount >= 1 && !achievements.find((a) => a.id === 'first-card')) {
        achievements.push({
          id: 'first-card',
          title: 'Первое понятие',
          description: 'Выучил первую карточку',
          icon: '🃏',
          unlockedAt: new Date().toISOString(),
        })
      }
      if (knownCount >= 50 && !achievements.find((a) => a.id === 'cards-50')) {
        achievements.push({
          id: 'cards-50',
          title: 'Знаток понятий',
          description: 'Выучил 50 карточек',
          icon: '🧠',
          unlockedAt: new Date().toISOString(),
        })
      }
      return { ...prev, flashcards, achievements }
    })
  }, [])

  const resetFlashcards = useCallback((cardIds: string[]) => {
    setState((prev) => {
      const flashcards = { ...prev.flashcards }
      for (const id of cardIds) delete flashcards[id]
      return { ...prev, flashcards }
    })
  }, [])

  const value = useMemo(
    () => ({
      state,
      updateProfile,
      updateGoal,
      toggleGoalTopic,
      toggleGoalTask,
      updateMockExam,
      updateMonthlyMockExam,
      toggleLesson,
      recordTaskAttempt,
      addPracticeRecord,
      setFlashcardStatus,
      resetFlashcards,
      totalLessons,
      completedLessonsCount,
      theoryProgress,
      moduleMastery,
    }),
    [
      state,
      updateProfile,
      updateGoal,
      toggleGoalTopic,
      toggleGoalTask,
      updateMockExam,
      updateMonthlyMockExam,
      toggleLesson,
      recordTaskAttempt,
      addPracticeRecord,
      setFlashcardStatus,
      resetFlashcards,
      totalLessons,
      completedLessonsCount,
      theoryProgress,
      moduleMastery,
    ],
  )

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>
}

export function useStudent() {
  const ctx = useContext(StudentContext)
  if (!ctx) throw new Error('useStudent must be used within StudentProvider')
  return ctx
}

/** Тема цели и урок теории — одно и то же: отмечаем/снимаем их вместе. */
function applyTopicDone(
  prev: StudentState,
  topicId: string,
  lessonId: string | undefined,
  done: boolean,
): StudentState {
  const topics = prev.goal.completedTopics.filter((id) => id !== topicId)
  const lessons = lessonId ? prev.completedLessons.filter((id) => id !== lessonId) : prev.completedLessons
  return {
    ...prev,
    completedLessons: done && lessonId ? [...lessons, lessonId] : lessons,
    goal: { ...prev.goal, completedTopics: done ? [...topics, topicId] : topics },
  }
}

function withTheoryAchievements(state: StudentState, totalLessons: number): StudentState {
  const completed = state.completedLessons
  const achievements = [...state.achievements]
  if (completed.length >= 1 && !achievements.find((a) => a.id === 'first-theory')) {
    achievements.push({
      id: 'first-theory',
      title: 'Теоретик',
      description: 'Прошёл первый урок теории',
      icon: '📚',
      unlockedAt: new Date().toISOString(),
    })
  }
  if (completed.length >= totalLessons && !achievements.find((a) => a.id === 'theory-master')) {
    achievements.push({
      id: 'theory-master',
      title: 'Мастер теории',
      description: 'Прошёл все уроки теории',
      icon: '🎓',
      unlockedAt: new Date().toISOString(),
    })
  }
  return achievements.length === state.achievements.length ? state : { ...state, achievements }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || 'УЧ'
}

export { createDefaultStudentState as defaultStudentState }
