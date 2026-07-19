import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import {
  fetchCurrentSupabaseUser,
  fetchProfileById,
  isSupabaseConfigured,
  supabaseEmailInUse,
  supabasePhoneInUse,
  supabaseSignIn,
  supabaseSignOut,
  supabaseSignUp,
  supabaseSubmitIdentityVerification,
} from '../lib/supabase'
import * as SplashScreen from 'expo-splash-screen'
import type { AppRole, AuthScreen, IdDocumentType, IdentityVerification, LoginMethod, User } from '../types'
import { emptyIdentityVerification, needsIdentityVerification } from '../lib/identityVerification'
import { isValidEmail } from '../lib/email'
import {
  approveUserVerification,
  listAllUsers,
  rejectUserVerification,
  resolveUserById,
} from '../lib/adminUsers'
import {
  adminSendVerificationCodeToUser,
  requestVerificationCodeForUser,
  submitVerificationCodeForUser,
} from '../lib/verificationCodeService'

interface SignupInput {
  name: string
  method: LoginMethod
  phone?: string
  email?: string
  password: string
  confirmPassword: string
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
  loginTrainingAccount: (method: LoginMethod, identifier: string, password: string) => Promise<boolean>
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
    addressProofUri?: string
    addressProofMimeType?: string
    addressProofName?: string
  }) => Promise<boolean>
  requestVerificationCode: (phone: string) => Promise<boolean>
  adminSendVerificationCode: (userId: string) => Promise<{
    ok: boolean
    code?: string
    userName?: string
    error?: string
  }>
  submitVerificationCode: (code: string) => Promise<boolean>
  syncUserAfterVerification: (userId: string) => Promise<void>
  refreshCurrentUser: () => Promise<void>
  adminListUsers: () => Promise<User[]>
  adminApproveUser: (userId: string) => Promise<User | null>
  adminRejectUser: (userId: string) => Promise<User | null>
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
        if (!isSupabaseConfigured()) {
          await setSessionUserId(null)
        } else {
          await supabaseSignOut()
        }
        setUser(null)
        setReady(true)
        return
      }

      if (isSupabaseConfigured()) {
        try {
          const u = await fetchCurrentSupabaseUser()
          if (u) {
            setUser(u)
          } else {
            const local = await getCurrentUser()
            setUser(local)
          }
        } catch {
          const local = await getCurrentUser()
          setUser(local)
        }
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
    if (isSupabaseConfigured()) {
      try {
        const found = await fetchProfileById(userId)
        if (!found) {
          await disableBiometricLogin()
          await refreshBiometricState()
          setAuthError('Saved account not found. Log in with your password.')
          return false
        }
        const current = await fetchCurrentSupabaseUser()
        if (!current || current.id !== userId) {
          setAuthError('Session expired. Log in with your password.')
          return false
        }
        setUser(found)
        setAuthError(null)
        bumpAuthSession()
        return true
      } catch {
        setAuthError('Could not restore your session. Log in with your password.')
        return false
      }
    }

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
    if (isSupabaseConfigured()) {
      const { user: signedIn, error } = await supabaseSignIn(method, identifier, password)
      if (!signedIn || error) {
        setAuthError(error ?? 'Invalid credentials. Check your details and try again.')
        return false
      }
      await saveUser(signedIn)
      setUser(signedIn)
      setAuthError(null)
      bumpAuthSession()
      void maybeOfferBiometricSetup()
      return true
    }

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

  const loginTrainingAccount = useCallback(
    async (method: LoginMethod, identifier: string, password: string) => {
      clearAuthError()
      const found =
        method === 'phone' ? await findUserByPhone(identifier) : await findUserByEmail(identifier)

      if (!found || found.password !== password) {
        setAuthError('Training account not found. Reload the app to refresh demo data.')
        return false
      }

      if (isSupabaseConfigured()) {
        await supabaseSignOut()
      }

      await setSessionUserId(found.id)
      setUser(found)
      setAuthError(null)
      bumpAuthSession()
      return true
    },
    [bumpAuthSession, clearAuthError],
  )

  const signup = useCallback(async (input: SignupInput) => {
    if (!input.name.trim()) {
      setAuthError('Full name is required.')
      return false
    }

    if (input.password.length < 6) {
      setAuthError('Password must be at least 6 characters.')
      return false
    }

    if (input.password !== input.confirmPassword) {
      setAuthError('Passwords do not match.')
      return false
    }

    if (input.method === 'phone') {
      if (!input.phone?.trim()) {
        setAuthError('Phone number is required.')
        return false
      }
      const phoneTaken = isSupabaseConfigured()
        ? await supabasePhoneInUse(input.phone)
        : await phoneInUse(input.phone)
      if (phoneTaken) {
        setAuthError('This phone number is already registered.')
        return false
      }
    } else {
      if (!input.email?.trim()) {
        setAuthError('Email is required.')
        return false
      }
      if (!isValidEmail(input.email)) {
        setAuthError('Enter a valid email address.')
        return false
      }
      const emailTaken = isSupabaseConfigured()
        ? await supabaseEmailInUse(input.email)
        : await emailInUse(input.email)
      if (emailTaken) {
        setAuthError('This email is already registered.')
        return false
      }
    }

    if (isSupabaseConfigured()) {
      const { user: created, error, needsEmailConfirmation } = await supabaseSignUp(input)
      if (needsEmailConfirmation) {
        setAuthError('Check your email and tap the confirmation link, then log in.')
        navigateAuth('login')
        return false
      }
      if (!created || error) {
        setAuthError(error ?? 'Sign up failed. Try again.')
        return false
      }
      await saveUser(created)
      setUser(created)
      setAuthError(null)
      bumpAuthSession()

      if (input.enableQuickAccess) {
        const support = await getBiometricSupport()
        if (support.available) {
          await enableBiometricLogin(created.id)
          await refreshBiometricState()
        }
      }
      return true
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
  }, [bumpAuthSession, navigateAuth, refreshBiometricState])

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
    if (isSupabaseConfigured()) {
      await supabaseSignOut()
    } else {
      await setSessionUserId(null)
    }
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
      addressProofUri?: string
      addressProofMimeType?: string
      addressProofName?: string
    }) => {
      if (!user) return false

      const normalizedPhone = normalizePhone(data.phone)
      const hostAddressProof = user.role === 'host' ? !!data.addressProofUri : false

      if (isSupabaseConfigured()) {
        try {
          const verification: IdentityVerification = {
            status: 'pending',
            phoneVerified: false,
            verifiedPhone: normalizedPhone,
            idType: data.idType,
            idUploaded: true,
            idPhotoUri: data.idPhotoUri,
            address: data.address?.trim() ?? '',
            addressUploaded: hostAddressProof ? true : undefined,
            addressProofUri: data.addressProofUri,
            addressProofMimeType: data.addressProofMimeType,
            addressProofName: data.addressProofName,
            submittedAt: new Date().toISOString(),
          }
          const updated = await supabaseSubmitIdentityVerification(user, verification, normalizedPhone)
          await saveUser(updated)
          setUser(updated)
          setAuthError(null)
          return true
        } catch (err) {
          if (err instanceof Error && err.message === 'PHONE_IN_USE') {
            setAuthError('This phone number is already registered to another account.')
            return false
          }
          setAuthError('Could not submit verification. Try again.')
          return false
        }
      }

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
        addressUploaded: hostAddressProof ? true : undefined,
        addressProofUri: data.addressProofUri,
        addressProofMimeType: data.addressProofMimeType,
        addressProofName: data.addressProofName,
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

  const requestVerificationCode = useCallback(
    async (phone: string) => {
      if (!user) return false
      try {
        await requestVerificationCodeForUser(user.id, user.name, phone)
        const updated = await resolveUserById(user.id)
        if (updated) setUser(updated)
        setAuthError(null)
        return true
      } catch {
        setAuthError('Could not request a verification code. Try again.')
        return false
      }
    },
    [user],
  )

  const adminSendVerificationCode = useCallback(async (userId: string) => {
    return adminSendVerificationCodeToUser(userId)
  }, [])

  const submitVerificationCode = useCallback(
    async (code: string) => {
      if (!user) return false
      const result = await submitVerificationCodeForUser(user.id, code)
      if (!result.ok) {
        setAuthError(result.error ?? 'Could not verify code.')
        return false
      }
      const updated = await resolveUserById(user.id)
      if (updated) setUser(updated)
      setAuthError(null)
      return true
    },
    [user],
  )

  const userIdRef = useRef<string | undefined>(user?.id)
  userIdRef.current = user?.id

  const refreshCurrentUser = useCallback(async () => {
    const userId = userIdRef.current
    if (!userId) return
    const updated = await resolveUserById(userId)
    if (updated) setUser(updated)
  }, [])

  const syncUserAfterVerification = useCallback(
    async (userId: string) => {
      if (user?.id !== userId) return
      const updated = await resolveUserById(userId)
      if (updated) setUser(updated)
    },
    [user],
  )

  const adminListUsers = useCallback(() => listAllUsers(), [])

  const adminApproveUser = useCallback(
    async (userId: string) => {
      const updated = await approveUserVerification(userId)
      if (updated && user?.id === userId) setUser(updated)
      return updated
    },
    [user],
  )

  const adminRejectUser = useCallback(
    async (userId: string) => {
      const updated = await rejectUserVerification(userId)
      if (updated && user?.id === userId) setUser(updated)
      return updated
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
      loginTrainingAccount,
      loginWithBiometrics,
      signup,
      logout,
      enableBiometricLogin: enableBiometricLoginForUser,
      disableBiometricLogin: disableBiometricLoginForUser,
      acceptBiometricSetup,
      dismissBiometricSetup,
      submitIdentityVerification,
      requestVerificationCode,
      adminSendVerificationCode,
      submitVerificationCode,
      syncUserAfterVerification,
      refreshCurrentUser,
      adminListUsers,
      adminApproveUser,
      adminRejectUser,
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
      loginTrainingAccount,
      loginWithBiometrics,
      signup,
      logout,
      enableBiometricLoginForUser,
      disableBiometricLoginForUser,
      acceptBiometricSetup,
      dismissBiometricSetup,
      submitIdentityVerification,
      requestVerificationCode,
      adminSendVerificationCode,
      submitVerificationCode,
      syncUserAfterVerification,
      refreshCurrentUser,
      adminListUsers,
      adminApproveUser,
      adminRejectUser,
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
