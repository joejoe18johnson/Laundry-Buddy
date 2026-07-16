import AsyncStorage from '@react-native-async-storage/async-storage'
import { getHostProfileDetails } from '../data/mockData'
import type { HostReview } from '../types'

const REVIEWS_KEY = 'laundry-buddy-host-reviews'
const REVIEWED_BOOKINGS_KEY = 'laundry-buddy-reviewed-bookings'

async function readReviewMap(): Promise<Record<string, HostReview[]>> {
  const raw = await AsyncStorage.getItem(REVIEWS_KEY)
  if (!raw) return {}
  return JSON.parse(raw) as Record<string, HostReview[]>
}

async function writeReviewMap(map: Record<string, HostReview[]>) {
  await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(map))
}

async function readReviewedBookings(): Promise<Record<string, string[]>> {
  const raw = await AsyncStorage.getItem(REVIEWED_BOOKINGS_KEY)
  if (!raw) return {}
  return JSON.parse(raw) as Record<string, string[]>
}

async function writeReviewedBookings(map: Record<string, string[]>) {
  await AsyncStorage.setItem(REVIEWED_BOOKINGS_KEY, JSON.stringify(map))
}

export async function loadStoredReviewsForHost(hostId: string): Promise<HostReview[]> {
  const map = await readReviewMap()
  return map[hostId] ?? []
}

export async function saveReviewForHost(hostId: string, review: HostReview): Promise<void> {
  const map = await readReviewMap()
  const list = map[hostId] ?? []
  map[hostId] = [review, ...list]
  await writeReviewMap(map)
}

export async function hasReviewedBooking(userId: string, bookingId: string): Promise<boolean> {
  const map = await readReviewedBookings()
  return (map[userId] ?? []).includes(bookingId)
}

export async function markBookingReviewed(userId: string, bookingId: string): Promise<void> {
  const map = await readReviewedBookings()
  const list = map[userId] ?? []
  if (list.includes(bookingId)) return
  map[userId] = [bookingId, ...list]
  await writeReviewedBookings(map)
}

export function mergeHostReviews(hostId: string, stored: HostReview[]): HostReview[] {
  const seed = getHostProfileDetails(hostId).reviews
  const byId = new Map<string, HostReview>()
  for (const review of seed) byId.set(review.id, review)
  for (const review of stored) byId.set(review.id, review)
  return [...byId.values()].sort((a, b) => {
    const aTime = Date.parse(a.date)
    const bTime = Date.parse(b.date)
    if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) return bTime - aTime
    return 0
  })
}

export function summarizeRatings(reviews: HostReview[]): { rating: number; reviewCount: number } {
  if (!reviews.length) return { rating: 0, reviewCount: 0 }
  const total = reviews.reduce((sum, review) => sum + review.rating, 0)
  return {
    rating: Math.round((total / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
  }
}
