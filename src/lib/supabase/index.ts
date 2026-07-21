export { getSupabaseClient, resetSupabaseClientForTests } from './client'
export { authEmailFromPhone, getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from './config'
export {
  AUTH_CALLBACK_STORAGE_PATH,
  createSessionFromAuthRedirectUrl,
  getAuthRedirectDebugInfo,
  getSupabaseAuthDeepLinkUrl,
  getSupabaseAuthRedirectUrl,
  isSupabaseAuthCallbackUrl,
} from './authRedirect'
export {
  fetchCurrentSupabaseUser,
  fetchProfileById,
  supabaseEmailInUse,
  supabasePhoneInUse,
  supabaseSignIn,
  supabaseSignOut,
  supabaseSignUp,
  supabaseSubmitIdentityVerification,
  supabaseUpdateProfile,
} from './authService'
export type { Database } from './database.types'
