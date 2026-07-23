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
  fetchProfileByPhone,
  supabaseEmailInUse,
  supabasePhoneInUse,
  supabaseRequestPasswordReset,
  supabaseSignIn,
  supabaseSignOut,
  supabaseSignUp,
  supabaseSubmitIdentityVerification,
  supabaseUpdatePassword,
  supabaseUpdateProfile,
} from './authService'
export {
  buildHostListingForSync,
  fetchHostListingFromSupabase,
  fetchMarketplaceFromSupabase,
  upsertHostListingToSupabase,
} from './hostService'
export {
  fetchAccessibleThreadIdsFromSupabase,
  fetchSupportThreadIdsFromSupabase,
  fetchThreadMessagesFromSupabase,
  insertChatMessageToSupabase,
  subscribeToChatInserts,
} from './messageService'
export type { Database } from './database.types'
