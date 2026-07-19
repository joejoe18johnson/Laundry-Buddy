export { getSupabaseClient, resetSupabaseClientForTests } from './client'
export { authEmailFromPhone, getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from './config'
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
