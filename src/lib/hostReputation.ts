import { getHostProfileDetails } from '../data/mockData'
import { summarizeRatings } from './reviewStorage'
import type { Host, HostReview } from '../types'

/** Minimum completed dries to earn the top-rated host badge. */
export const TOP_RATED_MIN_DRIES = 10

/** Minimum average rating (4 stars and above). */
export const TOP_RATED_MIN_RATING = 4

export function getHostLoadsHosted(hostId: string): number {
  return getHostProfileDetails(hostId).loadsHosted
}

export function getEffectiveHostRating(host: Host, reviews: HostReview[] = []): number {
  const summary = summarizeRatings(reviews)
  if (summary.rating > 0) return summary.rating
  return host.rating
}

export function isTopRatedHost(host: Host, reviews: HostReview[] = []): boolean {
  const rating = getEffectiveHostRating(host, reviews)
  if (rating < TOP_RATED_MIN_RATING) return false
  return getHostLoadsHosted(host.id) >= TOP_RATED_MIN_DRIES
}
