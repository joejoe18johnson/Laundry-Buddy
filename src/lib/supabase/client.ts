import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { AppState, type AppStateStatus } from 'react-native'
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from './config'
import type { Database } from './database.types'

let client: SupabaseClient<Database> | null = null
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null

function bindAppStateRefresh(supabase: SupabaseClient<Database>) {
  if (appStateSubscription) return

  appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh()
      return
    }
    void supabase.auth.stopAutoRefresh()
  })
}

/** Lazily create the Supabase client. Returns null when env vars are missing. */
export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) return null

  if (client) return client

  const url = getSupabaseUrl()!
  const anonKey = getSupabaseAnonKey()!

  client = createClient<Database>(url, anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  })

  bindAppStateRefresh(client)
  return client
}

/** Reset client (tests / hot reload). */
export function resetSupabaseClientForTests() {
  appStateSubscription?.remove()
  appStateSubscription = null
  client = null
}
