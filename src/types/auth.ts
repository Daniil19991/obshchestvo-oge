export interface AuthUser {
  id: string
  email: string
  name: string
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
