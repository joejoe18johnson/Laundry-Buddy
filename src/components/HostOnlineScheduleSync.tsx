import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { getHostByUserId } from '../data/mockData'
import { isWithinDropOffAvailability, resolveEffectiveHostOnline } from '../lib/dropOffAvailability'
import { isIdentityVerified } from '../lib/identityVerification'
import { upsertHostListingToSupabase } from '../lib/supabase/hostService'

/** Keeps Supabase is_online in sync when drop-off hours make a host effectively online. */
export function HostOnlineScheduleSync() {
  const { user } = useAuth()
  const { hostSettings } = useApp()
  const lastEffectiveRef = useRef<boolean | null>(null)

  useEffect(() => {
    if (user?.role !== 'host' || !hostSettings || !isIdentityVerified(user)) return

    const sync = async () => {
      const effective = resolveEffectiveHostOnline(hostSettings)
      if (lastEffectiveRef.current === effective) return
      lastEffectiveRef.current = effective

      const host = getHostByUserId(user.id)
      if (!host) return
      await upsertHostListingToSupabase(user, host, hostSettings)
    }

    void sync()

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void sync()
    })

    const interval = setInterval(() => {
      if (isWithinDropOffAvailability(hostSettings.dropOffAvailability)) {
        void sync()
      }
    }, 60000)

    return () => {
      subscription.remove()
      clearInterval(interval)
    }
  }, [hostSettings, user])

  return null
}
