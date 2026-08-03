import type { HostReview } from '../../types'
import { getSupabaseClient } from './client'
import type { Database } from './database.types'

type ReviewRow = Database['public']['Tables']['host_reviews']['Row']

function rowToReview(row: ReviewRow): HostReview {
  return {
    id: row.id,
    author: row.author_name,
    rating: row.rating,
    comment: row.comment,
    date: new Date(row.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  }
}

export async function fetchReviewsForHostFromSupabase(hostId: string): Promise<HostReview[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('host_reviews')
    .select('*')
    .eq('host_id', hostId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data.map(rowToReview)
}

export async function insertReviewToSupabase(input: {
  hostId: string
  authorId: string
  authorName: string
  rating: number
  comment: string
  bookingId?: string | null
}): Promise<{ review: HostReview | null; duplicate: boolean }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { review: null, duplicate: false }

  const { data, error } = await supabase
    .from('host_reviews')
    .insert({
      host_id: input.hostId,
      author_id: input.authorId,
      author_name: input.authorName,
      rating: input.rating,
      comment: input.comment,
      booking_id: input.bookingId ?? null,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { review: null, duplicate: true }
    }
    return { review: null, duplicate: false }
  }

  if (!data) return { review: null, duplicate: false }
  return { review: rowToReview(data), duplicate: false }
}

export async function hasReviewForBookingInSupabase(
  authorId: string,
  bookingId: string,
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const { data, error } = await supabase
    .from('host_reviews')
    .select('id')
    .eq('author_id', authorId)
    .eq('booking_id', bookingId)
    .maybeSingle()

  return !error && !!data
}
