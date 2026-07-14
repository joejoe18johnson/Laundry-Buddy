import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ActivityIndicator, View } from 'react-native'
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
import { colors } from '../theme'
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
  ready: boolean
  authScreen: AuthScreen
  authError: string | null
  navigateAuth: (screen: AuthScreen) => void
  login: (method: LoginMethod, identifier: string, password: string) => Promise<boolean>
  signup: (input: SignupInput) => Promise<boolean>
  logout: () => Promise<void>
  submitHostVerification: (data: {
    address: string
    idUploaded: boolean
    addressUploaded: boolean
  }) => Promise<void>
  clearAuthError: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [authScreen, setAuthScreen] = useState<AuthScreen>('welcome')
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u)
      setReady(true)
    })
  }, [])

  const navigateAuth = useCallback((screen: AuthScreen) => {
    setAuthError(null)
    setAuthScreen(screen)
  }, [])

  const clearAuthError = useCallback(() => setAuthError(null), [])

  const login = useCallback(async (method: LoginMethod, identifier: string, password: string) => {
    const found =
      method === 'phone' ? await findUserByPhone(identifier) : await findUserByEmail(identifier)

    if (!found || found.password !== password) {
      setAuthError('Invalid credentials. Check your details and try again.')
      return false
    }

    await setSessionUserId(found.id)
    setUser(found)
    setAuthError(null)
    return true
  }, [])

  const signup = useCallback(async (input: SignupInput) => {
    if (input.method === 'phone') {
      if (!input.phone?.trim()) {
        setAuthError('Phone number is required.')
        return false
      }
      if (await phoneInUse(input.phone)) {
        setAuthError('This phone number is already registered.')
        return false
      }
    } else {
      if (!input.email?.trim()) {
        setAuthError('Email is required.')
        return false
      }
      if (await emailInUse(input.email)) {
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
          ? { status: 'none', idUploaded: false, addressUploaded: false, address: '' }
          : undefined,
    }

    await saveUser(newUser)
    await setSessionUserId(newUser.id)
    setUser(newUser)
    setAuthError(null)
    return true
  }, [])

  const logout = useCallback(async () => {
    await setSessionUserId(null)
    setUser(null)
    setAuthScreen('welcome')
    setAuthError(null)
  }, [])

  const submitHostVerification = useCallback(
    async (data: { address: string; idUploaded: boolean; addressUploaded: boolean }) => {
      if (!user || user.role !== 'host') return

      const verification: HostVerification = {
        status: 'pending',
        idUploaded: data.idUploaded,
        addressUploaded: data.addressUploaded,
        address: data.address.trim(),
        submittedAt: new Date().toISOString(),
      }

      const updated: User = { ...user, hostVerification: verification }
      await saveUser(updated)
      setUser(updated)
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      ready,
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
      ready,
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

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function needsHostVerification(user: User): boolean {
  return user.role === 'host' && user.hostVerification?.status !== 'verified'
}
