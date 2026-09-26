export type ExamType = 'oge' | 'ege'

export interface TheoryLesson {
  id: string
  title: string
  duration: string
  summary: string
  content: string
  completed: boolean
}

export interface TheoryModule {
  id: string
  title: string
  description: string
  examType: ExamType
  icon: string
  lessons: TheoryLesson[]
}

export interface PracticeSlot {
  id: string
  number: number
  title: string
  description: string
  examType: ExamType
  maxScore: number
  tasksCount: number
  tasksLoaded: boolean
  moduleId?: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt?: string
}

export interface PracticeRecord {
  id: string
  slotId: string
  slotTitle: string
  moduleId: string
  score: number
  maxScore: number
  date: string
}

export interface TaskAttempt {
  id: string
  moduleId: string
  slotId?: string
  correct: boolean
  date: string
}

export interface MockExamScores {
  test: number
  written: number
}

export type MonthlyMockExams = Record<string, MockExamScores>

export interface StudentGoal {
  examType: ExamType
  examDate: string
  completedTopics: string[]
  completedTaskNumbers: number[]
  mockExam: MockExamScores
  mockExamByMonth: MonthlyMockExams
}

export interface StudentProfile {
  name: string
  grade: number
  school: string
  bio: string
  joinedAt: string
  avatarInitials: string
}

export interface StudentState {
  profile: StudentProfile
  goal: StudentGoal
  completedLessons: string[]
  practiceHistory: PracticeRecord[]
  taskAttempts: TaskAttempt[]
  achievements: Achievement[]
}

export interface ModuleMastery {
  moduleId: string
  title: string
  icon: string
  value: number
  lessonsDone: number
  lessonsTotal: number
  correctTasks: number
  incorrectTasks: number
}
