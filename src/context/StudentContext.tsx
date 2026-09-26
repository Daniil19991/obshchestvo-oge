import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { theoryModules } from '../data/theory'
import type { MockExamScores, ModuleMastery, StudentGoal, StudentProfile, StudentState } from '../types'
import { calculateModuleMastery } from '../utils/moduleMastery'
import { createDefaultStudentState, loadStudentState, saveStudentState } from '../utils/storage'
import { useAuth } from './AuthContext'

interface StudentContextValue {
  state: StudentState
  updateProfile: (profile: Partial<StudentProfile>) => void
  updateGoal: (goal: Partial<StudentGoal>) => void
  toggleGoalTopic: (topicId: string) => void
  toggleGoalTask: (taskNumber: number) => void
  updateMockExam: (scores: Partial<MockExamScores>) => void
  updateMonthlyMockExam: (monthId: string, scores: Partial<MockExamScores>) => void
  toggleLesson: (lessonId: string) => void
  recordTaskAttempt: (moduleId: string, correct: boolean, slotId?: string) => void
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

  useEffect(() => {
    if (user) {
      setState(loadStudentState(user.id, user.name))
    }
  }, [user?.id, user?.name])

  useEffect(() => {
    if (user) {
      saveStudentState(state, user.id)
    }
  }, [state, user?.id])

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
    setState((prev) => {
      const completed = prev.goal.completedTopics.includes(topicId)
        ? prev.goal.completedTopics.filter((id) => id !== topicId)
        : [...prev.goal.completedTopics, topicId]
      return {
        ...prev,
        goal: { ...prev.goal, completedTopics: completed },
      }
    })
  }, [])

  const toggleGoalTask = useCallback((taskNumber: number) => {
    setState((prev) => {
      const completed = prev.goal.completedTaskNumbers.includes(taskNumber)
        ? prev.goal.completedTaskNumbers.filter((n) => n !== taskNumber)
        : [...prev.goal.completedTaskNumbers, taskNumber].sort((a, b) => a - b)
      return {
        ...prev,
        goal: { ...prev.goal, completedTaskNumbers: completed },
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
    setState((prev) => {
      const completed = prev.completedLessons.includes(lessonId)
        ? prev.completedLessons.filter((id) => id !== lessonId)
        : [...prev.completedLessons, lessonId]

      const achievements = [...prev.achievements]
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

      return { ...prev, completedLessons: completed, achievements }
    })
  }, [totalLessons])

  const recordTaskAttempt = useCallback((moduleId: string, correct: boolean, slotId?: string) => {
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
        },
      ],
    }))
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || 'УЧ'
}

export { createDefaultStudentState as defaultStudentState }
