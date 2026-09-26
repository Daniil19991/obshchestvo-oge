import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { backend, type SignUpParams } from '../lib/backend'
import type { AuthUser } from '../types/auth'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  /** возвращает 'confirm', если Supabase ждёт подтверждения email */
  register: (params: SignUpParams) => Promise<'ok' | 'confirm'>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    backend
      .restore()
      .then((u) => !cancelled && setUser(u))
      .finally(() => !cancelled && setIsLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setUser(await backend.signIn(email, password))
  }, [])

  const register = useCallback(async (params: SignUpParams) => {
    const result = await backend.signUp(params)
    if ('needsConfirmation' in result) return 'confirm'
    setUser(result.user)
    return 'ok'
  }, [])

  const logout = useCallback(() => {
    void backend.signOut()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
