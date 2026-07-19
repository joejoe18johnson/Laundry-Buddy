/**
 * Hand-written Supabase schema types.
 * Regenerate later with: npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type AppRole = 'customer' | 'host' | 'admin'
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected'
export type BookingStage = 'got-bag' | 'waiting' | 'drying' | 'ready' | 'picked-up'
export type PaymentMethod = 'cash' | 'bank_transfer'
export type PaymentStatus = 'paid' | 'pending'
export type RequestStatus = 'pending' | 'accepted' | 'declined'
export type SheetsOption = 'own' | 'buy' | 'none'
export type ChatMessageKind = 'text' | 'image' | 'payment_proof' | 'system'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          phone: string | null
          email: string | null
          role: AppRole
          identity_verification: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          phone?: string | null
          email?: string | null
          role?: AppRole
          identity_verification?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          email?: string | null
          role?: AppRole
          identity_verification?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hosts: {
        Row: {
          id: string
          host_user_id: string | null
          name: string
          location: string
          district: string | null
          rating: number
          review_count: number
          price: number
          slots_left: number
          turnaround_hours: number
          dryer_type: string
          has_generator: boolean
          folding_price: number | null
          sheets_price: number | null
          address: string
          gate_code: string
          photos: Json
          rules: Json
          whatsapp: string
          latitude: number
          longitude: number
          bio: string | null
          member_since: string | null
          loads_hosted: number
          response_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          host_user_id?: string | null
          name: string
          location: string
          district?: string | null
          rating?: number
          review_count?: number
          price: number
          slots_left?: number
          turnaround_hours?: number
          dryer_type?: string
          has_generator?: boolean
          folding_price?: number | null
          sheets_price?: number | null
          address: string
          gate_code?: string
          photos?: Json
          rules?: Json
          whatsapp?: string
          latitude: number
          longitude: number
          bio?: string | null
          member_since?: string | null
          loads_hosted?: number
          response_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['hosts']['Insert']>
        Relationships: []
      }
      host_settings: {
        Row: {
          host_user_id: string
          settings: Json
          updated_at: string
        }
        Insert: {
          host_user_id: string
          settings: Json
          updated_at?: string
        }
        Update: {
          host_user_id?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          host_id: string
          host_name: string
          customer_id: string | null
          customer_name: string
          location: string
          loads: number
          drop_off_time: string
          sheets_option: SheetsOption
          notes: string
          stage: BookingStage
          address: string
          gate_code: string
          stage_times: Json
          is_new: boolean
          completed_at: string | null
          payment_method: PaymentMethod | null
          price_per_load: number | null
          dry_price: number | null
          folding_price: number | null
          sheets_price: number | null
          folding_service: boolean
          total_amount: number | null
          payment_status: PaymentStatus | null
          payment_proof_sent_at: string | null
          payment_proof_uri: string | null
          payment_requested_at: string | null
          request_status: RequestStatus
          load_photo_uri: string | null
          dry_photo_uri: string | null
          clothes_list: Json
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          host_id: string
          host_name: string
          customer_id?: string | null
          customer_name: string
          location: string
          loads: number
          drop_off_time: string
          sheets_option?: SheetsOption
          notes?: string
          stage?: BookingStage
          address: string
          gate_code?: string
          stage_times?: Json
          is_new?: boolean
          completed_at?: string | null
          payment_method?: PaymentMethod | null
          price_per_load?: number | null
          dry_price?: number | null
          folding_price?: number | null
          sheets_price?: number | null
          folding_service?: boolean
          total_amount?: number | null
          payment_status?: PaymentStatus | null
          payment_proof_sent_at?: string | null
          payment_proof_uri?: string | null
          payment_requested_at?: string | null
          request_status?: RequestStatus
          load_photo_uri?: string | null
          dry_photo_uri?: string | null
          clothes_list?: Json
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          thread_id: string
          sender_id: string
          sender_name: string
          sender_role: string
          text: string | null
          image_uri: string | null
          kind: ChatMessageKind
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          sender_id: string
          sender_name: string
          sender_role: string
          text?: string | null
          image_uri?: string | null
          kind?: ChatMessageKind
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>
        Relationships: []
      }
      chat_read_receipts: {
        Row: {
          user_id: string
          thread_id: string
          read_at: string
        }
        Insert: {
          user_id: string
          thread_id: string
          read_at?: string
        }
        Update: {
          user_id?: string
          thread_id?: string
          read_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          read: boolean
          link: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          read?: boolean
          link?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
        Relationships: []
      }
      host_reviews: {
        Row: {
          id: string
          host_id: string
          author_id: string | null
          author_name: string
          rating: number
          comment: string
          booking_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          host_id: string
          author_id?: string | null
          author_name: string
          rating: number
          comment: string
          booking_id?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['host_reviews']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      app_role: AppRole
      verification_status: VerificationStatus
      booking_stage: BookingStage
      payment_method: PaymentMethod
      payment_status: PaymentStatus
      request_status: RequestStatus
      sheets_option: SheetsOption
      chat_message_kind: ChatMessageKind
    }
    CompositeTypes: Record<string, never>
  }
}
