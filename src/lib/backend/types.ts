import type { StudentState } from '../../types'
import type { AuthUser, UserRole } from '../../types/auth'

/** Событие «ученик решил задание» — из них строятся уведомления учителя. */
export interface TaskEvent {
  id: string
  studentId: string
  studentName: string
  taskId: string
  moduleId: string
  format: 'test' | 'written'
  kind?: string
  slotTitle?: string
  score: number
  maxScore: number
  correct: boolean
  createdAt: string
}

export type NewTaskEvent = Omit<TaskEvent, 'id' | 'createdAt'>

export interface StudentSummary {
  id: string
  name: string
  email: string
  createdAt: string
  state: StudentState | null
  updatedAt: string | null
}

export interface SignUpParams {
  email: string
  password: string
  name: string
  role: UserRole
  teacherCode?: string
}

export type SignUpResult = { user: AuthUser } | { needsConfirmation: true }

export interface Backend {
  /** 'supabase' — общий сервер; 'local' — демо, всё в этом браузере */
  mode: 'supabase' | 'local'
  restore(): Promise<AuthUser | null>
  signIn(email: string, password: string): Promise<AuthUser>
  signUp(params: SignUpParams): Promise<SignUpResult>
  signOut(): Promise<void>

  loadState(userId: string): Promise<{ state: StudentState; updatedAt: string } | null>
  saveState(userId: string, state: StudentState): Promise<void>
  logEvent(event: NewTaskEvent): Promise<void>

  // только для учителя
  listStudents(): Promise<StudentSummary[]>
  getStudent(id: string): Promise<StudentSummary | null>
  listEvents(options?: { limit?: number; studentId?: string }): Promise<TaskEvent[]>
  getNotificationsSeenAt(userId: string): Promise<string | null>
  markNotificationsSeen(userId: string): Promise<void>
}
