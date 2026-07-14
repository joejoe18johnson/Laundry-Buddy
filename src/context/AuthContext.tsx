import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { normalizePhone } from '../lib/phone'
import {
  emailInUse,
  findUserByEmail,
  findUserByPhone,
  getCurrentUser,
  phoneInUse,
  saveUser,
  setSessionUserId,
} from '../lib/authStorage'
import type { AppRole, AuthScreen, HostVerification, LoginMethod, User } from '../types'

interface SignupInput {
  name: string
  method: LoginMethod
  phone?: string
  email?: string
  password: string
  role: AppRole
}

interface AuthState {
  user: User | null
  authScreen: AuthScreen
  authError: string | null
  navigateAuth: (screen: AuthScreen) => void
  login: (method: LoginMethod, identifier: string, password: string) => boolean
  signup: (input: SignupInput) => boolean
  logout: () => void
  submitHostVerification: (data: {
    address: string
    idUploaded: boolean
    addressUploaded: boolean
  }) => void
  clearAuthError: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getCurrentUser())
  const [authScreen, setAuthScreen] = useState<AuthScreen>('welcome')
  const [authError, setAuthError] = useState<string | null>(null)

  const navigateAuth = useCallback((screen: AuthScreen) => {
    setAuthError(null)
    setAuthScreen(screen)
  }, [])

  const clearAuthError = useCallback(() => setAuthError(null), [])

  const login = useCallback((method: LoginMethod, identifier: string, password: string) => {
    const found =
      method === 'phone'
        ? findUserByPhone(identifier)
        : findUserByEmail(identifier)

    if (!found || found.password !== password) {
      setAuthError('Invalid credentials. Check your details and try again.')
      return false
    }

    setSessionUserId(found.id)
    setUser(found)
    setAuthError(null)
    return true
  }, [])

  const signup = useCallback((input: SignupInput) => {
    if (input.method === 'phone') {
      if (!input.phone?.trim()) {
        setAuthError('Phone number is required.')
        return false
      }
      if (phoneInUse(input.phone)) {
        setAuthError('This phone number is already registered.')
        return false
      }
    } else {
      if (!input.email?.trim()) {
        setAuthError('Email is required.')
        return false
      }
      if (emailInUse(input.email)) {
        setAuthError('This email is already registered.')
        return false
      }
    }

    if (input.password.length < 6) {
      setAuthError('Password must be at least 6 characters.')
      return false
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: input.name.trim(),
      phone: input.phone ? normalizePhone(input.phone) : undefined,
      email: input.email?.trim().toLowerCase(),
      password: input.password,
      role: input.role,
      hostVerification:
        input.role === 'host'
          ? {
              status: 'none',
              idUploaded: false,
              addressUploaded: false,
              address: '',
            }
          : undefined,
    }

    saveUser(newUser)
    setSessionUserId(newUser.id)
    setUser(newUser)
    setAuthError(null)
    return true
  }, [])

  const logout = useCallback(() => {
    setSessionUserId(null)
    setUser(null)
    setAuthScreen('welcome')
    setAuthError(null)
  }, [])

  const submitHostVerification = useCallback(
    (data: { address: string; idUploaded: boolean; addressUploaded: boolean }) => {
      if (!user || user.role !== 'host') return

      const verification: HostVerification = {
        status: 'pending',
        idUploaded: data.idUploaded,
        addressUploaded: data.addressUploaded,
        address: data.address.trim(),
        submittedAt: new Date().toISOString(),
      }

      const updated: User = { ...user, hostVerification: verification }
      saveUser(updated)
      setUser(updated)
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      authScreen,
      authError,
      navigateAuth,
      login,
      signup,
      logout,
      submitHostVerification,
      clearAuthError,
    }),
    [
      user,
      authScreen,
      authError,
      navigateAuth,
      login,
      signup,
      logout,
      submitHostVerification,
      clearAuthError,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function isHostVerified(user: User): boolean {
  return user.role !== 'host' || user.hostVerification?.status === 'verified'
}

export function needsHostVerification(user: User): boolean {
  return user.role === 'host' && user.hostVerification?.status !== 'verified'
}
