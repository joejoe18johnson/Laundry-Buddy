import type { Booking, BookingStage, ClothesListItem, HostRequest, SheetsOption } from '../../types'
import type { Database } from './database.types'

type BookingRow = Database['public']['Tables']['bookings']['Row']
type BookingInsert = Database['public']['Tables']['bookings']['Insert']

function parseDropOffHour(value: string): Booking['dropOffTime'] {
  const parsed = Number.parseInt(value, 10)
  if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 23) {
    return parsed as Booking['dropOffTime']
  }
  return 14
}

function parseStageTimes(raw: unknown): Partial<Record<BookingStage, string>> {
  if (!raw || typeof raw !== 'object') return {}
  return raw as Partial<Record<BookingStage, string>>
}

function parseClothesList(raw: unknown): ClothesListItem[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined
  return raw as ClothesListItem[]
}

export function bookingRowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    hostId: row.host_id,
    hostName: row.host_name,
    customerId: row.customer_id ?? undefined,
    customerName: row.customer_name,
    location: row.location,
    loads: row.loads,
    dropOffTime: parseDropOffHour(row.drop_off_time),
    sheetsOption: row.sheets_option as SheetsOption,
    notes: row.notes,
    stage: row.stage,
    address: row.address,
    gateCode: row.gate_code,
    stageTimes: parseStageTimes(row.stage_times),
    isNew: row.is_new,
    completedAt: row.completed_at ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    pricePerLoad: row.price_per_load ?? undefined,
    dryPrice: row.dry_price ?? undefined,
    foldingPrice: row.folding_price ?? undefined,
    sheetsPrice: row.sheets_price ?? undefined,
    foldingService: row.folding_service,
    totalAmount: row.total_amount ?? undefined,
    paymentStatus: row.payment_status ?? undefined,
    paymentProofSentAt: row.payment_proof_sent_at ?? undefined,
    paymentProofUri: row.payment_proof_uri ?? undefined,
    paymentRequestedAt: row.payment_requested_at ?? undefined,
    requestStatus: row.request_status,
    loadPhotoUri: row.load_photo_uri ?? undefined,
    dryPhotoUri: row.dry_photo_uri ?? undefined,
    clothesList: parseClothesList(row.clothes_list),
    acceptedAt: row.accepted_at ?? undefined,
    createdAt: row.created_at,
    guestPickupConfirmedAt: row.guest_pickup_confirmed_at ?? undefined,
    hostPickupConfirmedAt: row.host_pickup_confirmed_at ?? undefined,
  }
}

export function bookingToInsert(booking: Booking): BookingInsert {
  return {
    id: booking.id,
    host_id: booking.hostId,
    host_name: booking.hostName,
    customer_id: booking.customerId ?? null,
    customer_name: booking.customerName,
    location: booking.location,
    loads: booking.loads,
    drop_off_time: String(booking.dropOffTime),
    sheets_option: booking.sheetsOption,
    notes: booking.notes,
    stage: booking.stage,
    address: booking.address || booking.location,
    gate_code: booking.gateCode,
    stage_times: booking.stageTimes as BookingInsert['stage_times'],
    is_new: booking.isNew ?? false,
    completed_at: booking.completedAt ?? null,
    payment_method: booking.paymentMethod ?? null,
    price_per_load: booking.pricePerLoad ?? null,
    dry_price: booking.dryPrice ?? null,
    folding_price: booking.foldingPrice ?? null,
    sheets_price: booking.sheetsPrice ?? null,
    folding_service: booking.foldingService ?? false,
    total_amount: booking.totalAmount ?? null,
    payment_status: booking.paymentStatus ?? null,
    payment_proof_sent_at: booking.paymentProofSentAt ?? null,
    payment_proof_uri: booking.paymentProofUri ?? null,
    payment_requested_at: booking.paymentRequestedAt ?? null,
    request_status: booking.requestStatus ?? 'pending',
    load_photo_uri: booking.loadPhotoUri ?? null,
    dry_photo_uri: booking.dryPhotoUri ?? null,
    clothes_list: (booking.clothesList ?? []) as unknown as BookingInsert['clothes_list'],
    accepted_at: booking.acceptedAt ?? null,
    created_at: booking.createdAt,
    guest_pickup_confirmed_at: booking.guestPickupConfirmedAt ?? null,
    host_pickup_confirmed_at: booking.hostPickupConfirmedAt ?? null,
  }
}

export function bookingToHostRequest(booking: Booking): HostRequest {
  return {
    id: booking.id,
    customerId: booking.customerId,
    customerName: booking.customerName,
    location: booking.location,
    loads: booking.loads,
    dropOffTime: booking.dropOffTime,
    sheetsOption: booking.sheetsOption,
    notes: booking.notes,
    paymentMethod: booking.paymentMethod,
    foldingService: booking.foldingService,
    totalAmount: booking.totalAmount,
    status: booking.requestStatus === 'declined' ? 'declined' : 'pending',
    createdAt: booking.createdAt,
    loadPhotoUri: booking.loadPhotoUri,
    clothesList: booking.clothesList,
  }
}

export function splitBookingsForHost(bookings: Booking[]): {
  pendingRequests: HostRequest[]
  activeLoads: Booking[]
} {
  const pendingRequests: HostRequest[] = []
  const activeLoads: Booking[] = []

  for (const booking of bookings) {
    if (booking.requestStatus === 'pending') {
      pendingRequests.push(bookingToHostRequest(booking))
      continue
    }
    if (booking.requestStatus === 'accepted' && booking.stage !== 'picked-up') {
      activeLoads.push(booking)
    }
  }

  return { pendingRequests, activeLoads }
}
