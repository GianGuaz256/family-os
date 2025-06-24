import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Database = {
  public: {
    Tables: {
      family_groups: {
        Row: {
          id: string
          name: string
          owner_id: string
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          invite_code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          invite_code?: string
          created_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          created_at?: string
        }
      }
      lists: {
        Row: {
          id: string
          group_id: string
          title: string
          items: any[]
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          title: string
          items?: any[]
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          title?: string
          items?: any[]
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          group_id: string
          name: string
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          url?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          group_id: string
          title: string
          date: string
          start_datetime?: string
          end_datetime?: string
          event_type: 'single' | 'recurring' | 'range'
          recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly'
          recurrence_interval?: number
          recurrence_end_date?: string
          description?: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          title: string
          date: string
          start_datetime?: string
          end_datetime?: string
          event_type?: 'single' | 'recurring' | 'range'
          recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly'
          recurrence_interval?: number
          recurrence_end_date?: string
          description?: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          title?: string
          date?: string
          start_datetime?: string
          end_datetime?: string
          event_type?: 'single' | 'recurring' | 'range'
          recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly'
          recurrence_interval?: number
          recurrence_end_date?: string
          description?: string
          created_at?: string
        }
      }
      cards: {
        Row: {
          id: string
          group_id: string
          name: string
          brand: string | null
          card_number: string | null
          barcode: string | null
          points_balance: string | null
          expiry_date: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          brand?: string | null
          card_number?: string | null
          barcode?: string | null
          points_balance?: string | null
          expiry_date?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          brand?: string | null
          card_number?: string | null
          barcode?: string | null
          points_balance?: string | null
          expiry_date?: string | null
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
} 