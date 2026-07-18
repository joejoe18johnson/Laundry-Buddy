import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { SplashLoading } from '../components/SplashLoading'
import { normalizePhone } from '../lib/phone'
import {
  emailInUse,
  findUserByEmail,
  findUserByPhone,
  getCurrentUser,
  getUserById,
  phoneInUse,
  saveUser,
  setSessionUserId,
} from '../lib/authStorage'
import {
  disableBiometricLogin,
  enableBiometricLogin,
  getBiometricSupport,
  getBiometricUserId,
  isBiometricLoginEnabled,
  authenticateBiometric,
  type BiometricSupport,
} from '../lib/biometricAuth'
import { isFullFlowTesting } from '../lib/testingFlow'
import * as SplashScreen from 'expo-splash-screen'
import type { AppRole, AuthScreen, IdDocumentType, IdentityVerification, LoginMethod, User } from '../types'
import { emptyIdentityVerification, needsIdentityVerification } from '../lib/identityVerification'

interface SignupInput {
  name: string
  method: LoginMethod
  phone?: string
  email?: string
  password: string
  role: AppRole
  enableQuickAccess?: boolean
}

interface AuthState {
  user: User | null
  ready: boolean
  authScreen: AuthScreen
  authError: string | null
  biometricSupport: BiometricSupport
  biometricEnabled: boolean
  showBiometricSetupPrompt: boolean
  biometricSetupLoading: boolean
  authSessionKey: number
  navigateAuth: (screen: AuthScreen) => void
  login: (method: LoginMethod, identifier: string, password: string) => Promise<boolean>
  loginWithBiometrics: () => Promise<boolean>
  signup: (input: SignupInput) => Promise<boolean>
  logout: () => Promise<void>
  enableBiometricLogin: () => Promise<boolean>
  disableBiometricLogin: () => Promise<void>
  acceptBiometricSetup: () => Promise<boolean>
  dismissBiometricSetup: () => void
  submitIdentityVerification: (data: {
    phone: string
    idType: IdDocumentType
    idPhotoUri?: string
    address?: string
    addressUploaded?: boolean
  }) => Promise<boolean>
  clearAuthError: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [authScreen, setAuthScreen] = useState<AuthScreen>('welcome')
  const [authError, setAuthError] = useState<string | null>(null)
  const [biometricSupport, setBiometricSupport] = useState<BiometricSupport>({
    available: false,
    enrolled: false,
    label: 'Biometrics',
    icon: 'smartphone',
  })
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [showBiometricSetupPrompt, setShowBiometricSetupPrompt] = useState(false)
  const [biometricSetupLoading, setBiometricSetupLoading] = useState(false)
  const [authSessionKey, setAuthSessionKey] = useState(0)

  const bumpAuthSession = useCallback(() => {
    setAuthSessionKey((key) => key + 1)
  }, [])

  const refreshBiometricState = useCallback(async () => {
    const [support, enabled] = await Promise.all([
      getBiometricSupport(),
      isBiometricLoginEnabled(),
    ])
    setBiometricSupport(support)
    setBiometricEnabled(enabled)
  }, [])

  useEffect(() => {
    async function init() {
      if (isFullFlowTesting()) {
        await setSessionUserId(null)
        setUser(null)
        setReady(true)
        return
      }
      const u = await getCurrentUser()
      setUser(u)
      setReady(true)
    }
    void init()
    void refreshBiometricState()
  }, [refreshBiometricState])

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [ready])

  const navigateAuth = useCallback((screen: AuthScreen) => {
    setAuthError(null)
    setAuthScreen(screen)
  }, [])

  const clearAuthError = useCallback(() => setAuthError(null), [])

  const maybeOfferBiometricSetup = useCallback(async () => {
    const [support, enabled] = await Promise.all([
      getBiometricSupport(),
      isBiometricLoginEnabled(),
    ])
    if (support.available && !enabled) {
      setShowBiometricSetupPrompt(true)
    }
  }, [])

  const restoreUserSession = useCallback(async (userId: string) => {
    const found = await getUserById(userId)
    if (!found) {
      await disableBiometricLogin()
      await refreshBiometricState()
      setAuthError('Saved account not found. Log in with your password.')
      return false
    }
    await setSessionUserId(found.id)
    setUser(found)
    setAuthError(null)
    bumpAuthSession()
    return true
  }, [bumpAuthSession, refreshBiometricState])

  const loginWithBiometrics = useCallback(async () => {
    clearAuthError()
    const support = await getBiometricSupport()
    if (!support.available) {
      setAuthError(`${support.label} is not available on this device.`)
      return false
    }

    const userId = await getBiometricUserId()
    if (!userId) {
      setAuthError('Sign in with your password once to set up biometrics.')
      return false
    }

    const ok = await authenticateBiometric(`Sign in with ${support.label}`)
    if (!ok) return false

    return restoreUserSession(userId)
  }, [clearAuthError, restoreUserSession])

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
    bumpAuthSession()
    void maybeOfferBiometricSetup()
    return true
  }, [bumpAuthSession, maybeOfferBiometricSetup])

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
      identityVerification: emptyIdentityVerification(),
    }

    await saveUser(newUser)
    await setSessionUserId(newUser.id)
    setUser(newUser)
    setAuthError(null)
    bumpAuthSession()

    if (input.enableQuickAccess) {
      const support = await getBiometricSupport()
      if (support.available) {
        await enableBiometricLogin(newUser.id)
        await refreshBiometricState()
      }
    }

    return true
  }, [bumpAuthSession, refreshBiometricState])

  const enableBiometricLoginForUser = useCallback(async () => {
    if (!user) return false
    const ok = await enableBiometricLogin(user.id)
    if (ok) await refreshBiometricState()
    return ok
  }, [user, refreshBiometricState])

  const disableBiometricLoginForUser = useCallback(async () => {
    await disableBiometricLogin()
    await refreshBiometricState()
  }, [refreshBiometricState])

  const acceptBiometricSetup = useCallback(async () => {
    if (!user) return false
    setBiometricSetupLoading(true)
    try {
      const ok = await enableBiometricLogin(user.id)
      if (ok) await refreshBiometricState()
      setShowBiometricSetupPrompt(false)
      return ok
    } finally {
      setBiometricSetupLoading(false)
    }
  }, [user, refreshBiometricState])

  const dismissBiometricSetup = useCallback(() => {
    setShowBiometricSetupPrompt(false)
  }, [])

  const logout = useCallback(async () => {
    await setSessionUserId(null)
    setUser(null)
    setAuthScreen('welcome')
    setAuthError(null)
    setShowBiometricSetupPrompt(false)
  }, [])

  const submitIdentityVerification = useCallback(
    async (data: {
      phone: string
      idType: IdDocumentType
      idPhotoUri?: string
      address?: string
      addressUploaded?: boolean
    }) => {
      if (!user) return false

      const normalizedPhone = normalizePhone(data.phone)
      const existing = await findUserByPhone(normalizedPhone)
      if (existing && existing.id !== user.id) {
        setAuthError('This phone number is already registered to another account.')
        return false
      }

      const verification: IdentityVerification = {
        status: 'pending',
        phoneVerified: false,
        verifiedPhone: normalizedPhone,
        idType: data.idType,
        idUploaded: true,
        idPhotoUri: data.idPhotoUri,
        address: data.address?.trim() ?? '',
        addressUploaded: user.role === 'host' ? !!data.addressUploaded : undefined,
        submittedAt: new Date().toISOString(),
      }

      const updated: User = {
        ...user,
        phone: normalizedPhone,
        identityVerification: verification,
      }
      delete updated.hostVerification

      await saveUser(updated)
      setUser(updated)
      setAuthError(null)
      return true
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      ready,
      authScreen,
      authError,
      biometricSupport,
      biometricEnabled,
      showBiometricSetupPrompt,
      biometricSetupLoading,
      authSessionKey,
      navigateAuth,
      login,
      loginWithBiometrics,
      signup,
      logout,
      enableBiometricLogin: enableBiometricLoginForUser,
      disableBiometricLogin: disableBiometricLoginForUser,
      acceptBiometricSetup,
      dismissBiometricSetup,
      submitIdentityVerification,
      clearAuthError,
    }),
    [
      user,
      ready,
      authScreen,
      authError,
      biometricSupport,
      biometricEnabled,
      showBiometricSetupPrompt,
      biometricSetupLoading,
      authSessionKey,
      navigateAuth,
      login,
      loginWithBiometrics,
      signup,
      logout,
      enableBiometricLoginForUser,
      disableBiometricLoginForUser,
      acceptBiometricSetup,
      dismissBiometricSetup,
      submitIdentityVerification,
      clearAuthError,
    ],
  )

  if (!ready) {
    return <SplashLoading />
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function needsHostVerification(user: User): boolean {
  return needsIdentityVerification(user)
}

export { needsIdentityVerification }
