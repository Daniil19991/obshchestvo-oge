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

export type PracticePart = 'short' | 'written'

export interface PracticeSlot {
  id: string
  number: number
  part: PracticePart
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
  taskId?: string
  /** баллы за задание (для письменной части — самооценка по критериям) */
  score?: number
  maxScore?: number
  correct: boolean
  date: string
}

export type WrittenTaskKind =
  | 'concepts'
  | 'photo'
  | 'finance'
  | 'statistics'
  | 'case'
  | 'text-plan'
  | 'text-questions'
  | 'arguments'

export interface TaskCriterion {
  points: number
  text: string
}

export interface PracticeTask {
  id: string
  /** номер задания в каталоге «РЕШУ ОГЭ» (открытый банк ФИПИ) */
  sourceId: number
  moduleId: string
  format: 'test' | 'written'
  kind?: WrittenTaskKind
  /** текст-источник для заданий по тексту */
  source?: string
  text: string
  options?: string[]
  image?: string
  answer?: string
  solution: string
  criteria?: TaskCriterion[]
  maxScore: number
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
  /** @deprecated старые номера заданий (до 2027) — не используется */
  completedTaskNumbers: number[]
  completedTaskTypes: string[]
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

export interface Flashcard {
  id: string
  moduleId: string
  term: string
  definition: string
}

export type FlashcardStatus = 'known' | 'learning'

export interface StudentState {
  profile: StudentProfile
  goal: StudentGoal
  completedLessons: string[]
  practiceHistory: PracticeRecord[]
  taskAttempts: TaskAttempt[]
  achievements: Achievement[]
  flashcards: Record<string, FlashcardStatus>
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
