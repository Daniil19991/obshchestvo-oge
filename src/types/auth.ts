export type UserRole = 'student' | 'teacher'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: string
}

export interface AuthSession {
  userId: string
  email: string
  name: string
}

export interface StoredUser extends AuthUser {
  passwordHash: string
}
