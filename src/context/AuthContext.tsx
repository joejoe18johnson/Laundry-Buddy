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
import { isValidEmail } from '../lib/email'
import {
  disableBiometricLogin,
  enableBiometricLogin,
  getBiometricSupport,
  getBiometricUserId,
  isBiometricLoginEnabled,
  authenticateBiometric,
  type BiometricSupport,
} from '../lib/biometricAuth'
import {
  createSessionFromAuthRedirectUrl,
  fetchCurrentSupabaseUser,
  fetchProfileById,
  getSupabaseClient,
  isSupabaseAuthCallbackUrl,
  isSupabaseConfigured,
  supabaseEmailInUse,
  supabasePhoneInUse,
  supabaseRequestPasswordReset,
  supabaseSignIn,
  supabaseSignOut,
  supabaseSignUp,
  supabaseSubmitIdentityVerification,
  supabaseUpdatePassword,
} from '../lib/supabase'
import {
  ensureSupabaseAdminProfile,
  ensureTrainingAdminSupabaseSession,
  isLikelyAdminUser,
} from '../lib/supabase/adminAccess'
import { ADMIN_EMAIL, ADMIN_PHONE, ADMIN_SEED_PASSWORD } from '../data/seedData'
import * as SplashScreen from 'expo-splash-screen'
import * as Linking from 'expo-linking'
import type { AppRole, AuthScreen, IdDocumentType, IdentityVerification, LoginMethod, User } from '../types'
import {
  buildResubmitVerification,
  emptyIdentityVerification,
  getIdentityVerification,
  needsAddressResubmit,
  needsIdResubmit,
  needsSelfieResubmit,
  normalizeUserIdentity,
  needsIdentityVerification,
} from '../lib/identityVerification'
import {
  approveUserVerification,
  approveUserAddressVerification,
  approveUserIdVerification,
  approveUserSelfieVerification,
  listAllUsers,
  rejectUserVerification,
  rejectUserAddressVerification,
  rejectUserIdVerification,
  rejectUserSelfieVerification,
  resolveUserById,
  type AdminUserActionResult,
} from '../lib/adminUsers'
import { notifyAdminsOfNewSignup } from '../lib/adminNotifications'
import {
  adminSendVerificationCodeToUser,
  requestVerificationCodeForUser,
  submitVerificationCodeForUser,
} from '../lib/verificationCodeService'

interface SignupInput {
  name: string
  phone: string
  email: string
  password: string
  confirmPassword: string
  role: AppRole
}

interface AuthState {
  user: User | null
  ready: boolean
  authScreen: AuthScreen
  authError: string | null
  authNotice: string | null
  biometricSupport: BiometricSupport
  biometricEnabled: boolean
  showBiometricSetupPrompt: boolean
  biometricSetupLoading: boolean
  authSessionKey: number
  navigateAuth: (screen: AuthScreen) => void
  login: (method: LoginMethod, identifier: string, password: string) => Promise<boolean>
  loginWithBiometrics: () => Promise<boolean>
  signup: (input: SignupInput) => Promise<boolean>
  requestPasswordReset: (email: string) => Promise<boolean>
  resetPassword: (password: string, confirmPassword: string) => Promise<boolean>
  logout: () => Promise<void>
  enableBiometricLogin: () => Promise<boolean>
  disableBiometricLogin: () => Promise<void>
  acceptBiometricSetup: () => Promise<boolean>
  dismissBiometricSetup: () => void
  submitIdentityVerification: (data: {
    phone: string
    idType: IdDocumentType
    idPhotoUri?: string
    selfiePhotoUri?: string
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
  adminApproveUser: (userId: string) => Promise<AdminUserActionResult>
  adminRejectUser: (userId: string) => Promise<AdminUserActionResult>
  adminApproveUserId: (userId: string) => Promise<AdminUserActionResult>
  adminRejectUserId: (userId: string) => Promise<AdminUserActionResult>
  adminApproveUserAddress: (userId: string) => Promise<AdminUserActionResult>
  adminRejectUserAddress: (userId: string) => Promise<AdminUserActionResult>
  adminApproveUserSelfie: (userId: string) => Promise<AdminUserActionResult>
  adminRejectUserSelfie: (userId: string) => Promise<AdminUserActionResult>
  clearAuthError: () => void
  clearAuthNotice: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [authScreen, setAuthScreen] = useState<AuthScreen>('welcome')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authNotice, setAuthNotice] = useState<string | null>(null)
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
      if (isSupabaseConfigured()) {
        try {
          const u = await fetchCurrentSupabaseUser()
          if (u) {
            const merged = await resolveUserById(u.id)
            setUser(merged ?? u)
          } else {
            const local = await getCurrentUser()
            if (local && isLikelyAdminUser(local)) {
              const linked = await ensureTrainingAdminSupabaseSession(local)
              if (linked.ok && linked.user) {
                await saveUser(linked.user)
                await setSessionUserId(linked.user.id)
                setUser(linked.user)
              } else {
                setUser(local)
              }
            } else {
              setUser(local)
            }
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

  const handleAuthRedirect = useCallback(
    async (url: string | null) => {
      if (!url || !isSupabaseAuthCallbackUrl(url)) return

      const result = await createSessionFromAuthRedirectUrl(url)
      if (result.error) {
        setAuthError(result.error)
        setAuthScreen('login')
        return
      }

      if (result.recovery) {
        if (result.user) {
          await saveUser(result.user)
          setUser(result.user)
        }
        setAuthError(null)
        setAuthNotice('Choose a new password for your account.')
        setAuthScreen('reset-password')
        return
      }

      if (result.user) {
        await saveUser(result.user)
        setUser(result.user)
        setAuthError(null)
        setAuthNotice('Email confirmed! Welcome to Laundry Buddy.')
        bumpAuthSession()
        return
      }

      if (result.confirmed) {
        setAuthNotice('Email confirmed! Log in with your email and password.')
        setAuthScreen('login')
      }
    },
    [bumpAuthSession],
  )

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    void Linking.getInitialURL().then((url) => handleAuthRedirect(url))

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleAuthRedirect(url)
    })

    return () => subscription.remove()
  }, [handleAuthRedirect])

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const supabase = getSupabaseClient()
    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthError(null)
        setAuthNotice('Choose a new password for your account.')
        setAuthScreen('reset-password')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

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
  const clearAuthNotice = useCallback(() => setAuthNotice(null), [])

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
        const found = await resolveUserById(userId)
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
    if (method === 'email' && !identifier.trim()) {
      setAuthError('Email is required.')
      return false
    }

    if (isSupabaseConfigured()) {
      let { user: signedIn, error } = await supabaseSignIn(method, identifier, password)

      if (
        !signedIn &&
        method === 'email' &&
        identifier.trim().toLowerCase() === 'support@laundrybuddy.app' &&
        password === ADMIN_SEED_PASSWORD
      ) {
        const linked = await ensureTrainingAdminSupabaseSession({
          id: 'user-support-admin',
          name: 'Support Admin',
          email: 'support@laundrybuddy.app',
          phone: ADMIN_PHONE,
          password: ADMIN_SEED_PASSWORD,
          role: 'admin',
          identityVerification: emptyIdentityVerification(),
        })
        if (linked.ok && linked.user) {
          signedIn = linked.user
          error = null
        } else if (linked.error) {
          error = linked.error
        }
      }

      if (!signedIn || error) {
        setAuthError(error ?? 'Invalid credentials. Check your details and try again.')
        return false
      }
      const merged = await resolveUserById(signedIn.id)
      let sessionUser = merged ?? signedIn
      const adminLoginAttempt =
        method === 'email' && identifier.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()
      if (adminLoginAttempt || isLikelyAdminUser(sessionUser)) {
        sessionUser = normalizeUserIdentity({
          ...sessionUser,
          role: 'admin',
          email: sessionUser.email ?? ADMIN_EMAIL,
          phone: sessionUser.phone ?? ADMIN_PHONE,
        })
        try {
          sessionUser = await ensureSupabaseAdminProfile(sessionUser)
        } catch {
          // Verification actions will surface admin setup errors.
        }
      }
      await saveUser(sessionUser)
      await setSessionUserId(sessionUser.id)
      setUser(sessionUser)
      setAuthError(null)
      bumpAuthSession()
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
    return true
  }, [bumpAuthSession])

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

    if (!input.phone?.trim()) {
      setAuthError('Phone number is required.')
      return false
    }

    if (!input.email?.trim()) {
      setAuthError('Email is required.')
      return false
    }

    if (!isValidEmail(input.email)) {
      setAuthError('Enter a valid email address.')
      return false
    }

    const phoneTaken = isSupabaseConfigured()
      ? await supabasePhoneInUse(input.phone)
      : await phoneInUse(input.phone)
    if (phoneTaken) {
      setAuthError('This phone number is already registered. Log in instead.')
      return false
    }

    const emailTaken = isSupabaseConfigured()
      ? await supabaseEmailInUse(input.email)
      : await emailInUse(input.email)
    if (emailTaken) {
      setAuthError('This email is already registered. Log in instead.')
      return false
    }

    if (isSupabaseConfigured()) {
      const { user: created, error, needsEmailConfirmation } = await supabaseSignUp({
        name: input.name,
        phone: input.phone,
        email: input.email,
        password: input.password,
        role: input.role,
      })
      if (needsEmailConfirmation) {
        setAuthNotice('Account created. Log in with your email and password.')
        setAuthError(null)
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
      void notifyAdminsOfNewSignup(created)

      return true
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: input.name.trim(),
      phone: normalizePhone(input.phone),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      role: input.role,
      identityVerification: emptyIdentityVerification(),
    }

    await saveUser(newUser)
    await setSessionUserId(newUser.id)
    setUser(newUser)
    setAuthError(null)
    bumpAuthSession()
    void notifyAdminsOfNewSignup(newUser)

    return true
  }, [bumpAuthSession, navigateAuth, refreshBiometricState])

  const requestPasswordReset = useCallback(async (email: string) => {
    clearAuthError()
    clearAuthNotice()

    if (!isSupabaseConfigured()) {
      setAuthError('Password reset is only available when Supabase is connected.')
      return false
    }

    if (!isValidEmail(email)) {
      setAuthError('Enter a valid email address.')
      return false
    }

    const { error } = await supabaseRequestPasswordReset(email)
    if (error) {
      setAuthError(error)
      return false
    }

    setAuthNotice('Check your email for a password reset link. It may take a minute to arrive.')
    navigateAuth('login')
    return true
  }, [clearAuthError, clearAuthNotice, navigateAuth])

  const resetPassword = useCallback(async (password: string, confirmPassword: string) => {
    clearAuthError()

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.')
      return false
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.')
      return false
    }

    if (!isSupabaseConfigured()) {
      setAuthError('Password reset is only available when Supabase is connected.')
      return false
    }

    const { error } = await supabaseUpdatePassword(password)
    if (error) {
      setAuthError(error)
      return false
    }

    await supabaseSignOut()
    await setSessionUserId(null)
    setUser(null)
    setAuthError(null)
    setAuthNotice('Password updated. Log in with your email and new password.')
    navigateAuth('login')
    return true
  }, [clearAuthError, navigateAuth])

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
      selfiePhotoUri?: string
      address?: string
      addressProofUri?: string
      addressProofMimeType?: string
      addressProofName?: string
    }) => {
      if (!user) return false

      const normalizedPhone = normalizePhone(data.phone)
      const existingVerification = getIdentityVerification(user)
      const isResubmit = existingVerification.status === 'rejected'
      const idResubmit = !isResubmit || needsIdResubmit(user)
      const selfieResubmit = !isResubmit || needsSelfieResubmit(user)
      const addressResubmit =
        user.role === 'host' && (!isResubmit || needsAddressResubmit(user))

      if (selfieResubmit && !data.selfiePhotoUri && !existingVerification.selfiePhotoUri) {
        setAuthError('A verification selfie is required.')
        return false
      }
      if (idResubmit && (!data.idType || !data.idPhotoUri) && !existingVerification.idPhotoUri) {
        setAuthError('A government ID photo is required.')
        return false
      }
      if (
        addressResubmit &&
        (!data.addressProofUri || !data.address?.trim()) &&
        !existingVerification.addressProofUri
      ) {
        setAuthError('Address proof is required for hosts.')
        return false
      }

      const hostAddressProof = user.role === 'host'
        ? !!(data.addressProofUri ?? existingVerification.addressProofUri)
        : false

      if (isSupabaseConfigured()) {
        try {
          const verification = buildResubmitVerification(user, {
            phone: normalizedPhone,
            idType: data.idType,
            idPhotoUri: data.idPhotoUri ?? existingVerification.idPhotoUri,
            selfiePhotoUri: data.selfiePhotoUri ?? existingVerification.selfiePhotoUri,
            address: data.address?.trim() ?? existingVerification.address,
            addressProofUri: data.addressProofUri ?? existingVerification.addressProofUri,
            addressProofMimeType:
              data.addressProofMimeType ?? existingVerification.addressProofMimeType,
            addressProofName: data.addressProofName ?? existingVerification.addressProofName,
          })
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

      const verification = buildResubmitVerification(user, {
        phone: normalizedPhone,
        idType: data.idType,
        idPhotoUri: data.idPhotoUri ?? existingVerification.idPhotoUri,
        selfiePhotoUri: data.selfiePhotoUri ?? existingVerification.selfiePhotoUri,
        address: data.address?.trim() ?? existingVerification.address,
        addressProofUri: data.addressProofUri ?? existingVerification.addressProofUri,
        addressProofMimeType:
          data.addressProofMimeType ?? existingVerification.addressProofMimeType,
        addressProofName: data.addressProofName ?? existingVerification.addressProofName,
      })

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

  const adminSendVerificationCode = useCallback(
    async (userId: string) => {
      return adminSendVerificationCodeToUser(userId, user)
    },
    [user],
  )

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

    const local = await getUserById(userId)
    if (local && isLikelyAdminUser(local) && isSupabaseConfigured()) {
      const linked = await ensureTrainingAdminSupabaseSession(local)
      if (linked.ok && linked.user) {
        await saveUser(linked.user)
        await setSessionUserId(linked.user.id)
        setUser(linked.user)
        return
      }
    }

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
      const result = await approveUserVerification(userId, user)
      if (result.user && user?.id === userId) setUser(result.user)
      return result
    },
    [user],
  )

  const adminRejectUser = useCallback(
    async (userId: string) => {
      const result = await rejectUserVerification(userId, user)
      if (result.user && user?.id === userId) setUser(result.user)
      return result
    },
    [user],
  )

  const adminApproveUserId = useCallback(
    async (userId: string) => {
      const result = await approveUserIdVerification(userId, user)
      if (result.user && user?.id === userId) setUser(result.user)
      return result
    },
    [user],
  )

  const adminRejectUserId = useCallback(
    async (userId: string) => {
      const result = await rejectUserIdVerification(userId, user)
      if (result.user && user?.id === userId) setUser(result.user)
      return result
    },
    [user],
  )

  const adminApproveUserAddress = useCallback(
    async (userId: string) => {
      const result = await approveUserAddressVerification(userId, user)
      if (result.user && user?.id === userId) setUser(result.user)
      return result
    },
    [user],
  )

  const adminRejectUserAddress = useCallback(
    async (userId: string) => {
      const result = await rejectUserAddressVerification(userId, user)
      if (result.user && user?.id === userId) setUser(result.user)
      return result
    },
    [user],
  )

  const adminApproveUserSelfie = useCallback(
    async (userId: string) => {
      const result = await approveUserSelfieVerification(userId, user)
      if (result.user && user?.id === userId) setUser(result.user)
      return result
    },
    [user],
  )

  const adminRejectUserSelfie = useCallback(
    async (userId: string) => {
      const result = await rejectUserSelfieVerification(userId, user)
      if (result.user && user?.id === userId) setUser(result.user)
      return result
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      ready,
      authScreen,
      authError,
      authNotice,
      biometricSupport,
      biometricEnabled,
      showBiometricSetupPrompt,
      biometricSetupLoading,
      authSessionKey,
      navigateAuth,
      login,
      loginWithBiometrics,
      signup,
      requestPasswordReset,
      resetPassword,
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
      adminApproveUserId,
      adminRejectUserId,
      adminApproveUserAddress,
      adminRejectUserAddress,
      adminApproveUserSelfie,
      adminRejectUserSelfie,
      clearAuthError,
      clearAuthNotice,
    }),
    [
      user,
      ready,
      authScreen,
      authError,
      authNotice,
      biometricSupport,
      biometricEnabled,
      showBiometricSetupPrompt,
      biometricSetupLoading,
      authSessionKey,
      navigateAuth,
      login,
      loginWithBiometrics,
      signup,
      requestPasswordReset,
      resetPassword,
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
      adminApproveUserId,
      adminRejectUserId,
      adminApproveUserAddress,
      adminRejectUserAddress,
      adminApproveUserSelfie,
      adminRejectUserSelfie,
      clearAuthError,
      clearAuthNotice,
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
