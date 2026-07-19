import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usersPendingIdReview } from '../lib/adminUsers'
import { getIdentityVerification } from '../lib/identityVerification'
import {
  countCodesByStatus,
  getAllVerificationCodes,
  type VerificationCodeRecord,
} from '../lib/verificationCodeStorage'
import { listOpenVerificationCodeRequests } from '../lib/verificationCodeService'
import type { VerificationCodeRequest } from '../lib/verificationRequestStorage'
import type { User } from '../types'

export function useAdminDashboardData(refreshKey = 0) {
  const { adminListUsers } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [codeRequests, setCodeRequests] = useState<VerificationCodeRequest[]>([])
  const [codes, setCodes] = useState<VerificationCodeRecord[]>([])
  const [codeCounts, setCodeCounts] = useState({ available: 0, assigned: 0, used: 0 })
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const [nextUsers, nextRequests, nextCodes, counts] = await Promise.all([
      adminListUsers(),
      listOpenVerificationCodeRequests(),
      getAllVerificationCodes(),
      countCodesByStatus(),
    ])
    setUsers(nextUsers.filter((entry) => entry.role !== 'admin'))
    setCodeRequests(nextRequests)
    setCodes(nextCodes)
    setCodeCounts(counts)
    setLoading(false)
  }, [adminListUsers])

  useEffect(() => {
    void reload()
  }, [reload, refreshKey])

  const idReviewUsers = useMemo(() => usersPendingIdReview(users), [users])
  const pendingUsers = useMemo(
    () => users.filter((entry) => getIdentityVerification(entry).status === 'pending'),
    [users],
  )
  const verifiedCount = useMemo(
    () => users.filter((entry) => getIdentityVerification(entry).status === 'verified').length,
    [users],
  )
  const queueCount = codeRequests.length + idReviewUsers.length

  return {
    users,
    codeRequests,
    codes,
    codeCounts,
    loading,
    reload,
    idReviewUsers,
    pendingUsers,
    verifiedCount,
    queueCount,
  }
}
