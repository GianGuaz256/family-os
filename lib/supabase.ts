import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks for build time
const getSupabaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  // Debug logging - remove after fixing
  if (typeof window !== 'undefined') {
    console.log('🔍 DEBUG - Environment variable check:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', url)
    console.log('Is undefined:', !url)
    console.log('Is placeholder:', url === 'your_supabase_project_url_here')
  }
  
  if (!url || url === 'your_supabase_project_url_here') {
    console.error('❌ Supabase URL not found or is placeholder:', url)
    // Fallback for build time - use a valid placeholder URL
    return 'https://placeholder.supabase.co'
  }
  
  console.log('✅ Using Supabase URL:', url)
  return url
}

const getSupabaseAnonKey = (): string => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Debug logging - remove after fixing
  if (typeof window !== 'undefined') {
    console.log('🔑 DEBUG - Anon key check:')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!key)
    console.log('Key length:', key?.length || 0)
  }
  
  if (!key || key === 'your_supabase_anon_key_here') {
    console.error('❌ Supabase anon key not found or is placeholder')
    // Fallback for build time - use a valid placeholder key
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
  }
  
  console.log('✅ Using Supabase anon key (length:', key.length, ')')
  return key
}

const supabaseUrl = getSupabaseUrl()
const supabaseAnonKey = getSupabaseAnonKey()

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Site URL utility function
export const getSiteUrl = (): string => {
  // In production, use the environment variable
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  
  // In development or if no site URL is set, use window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // Fallback for server-side rendering
  return 'http://localhost:3000'
}

// Authentication helper functions
export const getAuthRedirectUrl = (path: string = '/auth/callback'): string => {
  return `${getSiteUrl()}${path}`
}

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
          url: string | null
          file_data: Uint8Array | null
          file_size: number | null
          mime_type: string | null
          file_extension: string | null
          uploaded_by: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          url?: string | null
          file_data?: Uint8Array | null
          file_size?: number | null
          mime_type?: string | null
          file_extension?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          url?: string | null
          file_data?: Uint8Array | null
          file_size?: number | null
          mime_type?: string | null
          file_extension?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string | null
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
      subscriptions: {
        Row: {
          id: string
          group_id: string
          title: string
          provider?: string
          cost: number
          currency: string
          billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          billing_day?: number
          payer_id?: string
          category?: 'streaming' | 'utilities' | 'insurance' | 'software' | 'fitness' | 'food' | 'transport' | 'gaming' | 'news' | 'cloud' | 'other'
          payment_method?: string
          next_payment_date: string
          start_date: string
          end_date?: string
          auto_renew: boolean
          notify_days_before: number
          is_active: boolean
          description?: string
          website_url?: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          title: string
          provider?: string
          cost: number
          currency?: string
          billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          billing_day?: number
          payer_id?: string
          category?: 'streaming' | 'utilities' | 'insurance' | 'software' | 'fitness' | 'food' | 'transport' | 'gaming' | 'news' | 'cloud' | 'other'
          payment_method?: string
          next_payment_date: string
          start_date: string
          end_date?: string
          auto_renew?: boolean
          notify_days_before?: number
          is_active?: boolean
          description?: string
          website_url?: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          title?: string
          provider?: string
          cost?: number
          currency?: string
          billing_cycle?: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          billing_day?: number
          payer_id?: string
          category?: 'streaming' | 'utilities' | 'insurance' | 'software' | 'fitness' | 'food' | 'transport' | 'gaming' | 'news' | 'cloud' | 'other'
          payment_method?: string
          next_payment_date?: string
          start_date?: string
          end_date?: string
          auto_renew?: boolean
          notify_days_before?: number
          is_active?: boolean
          description?: string
          website_url?: string
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
      notes: {
        Row: {
          id: string
          group_id: string
          title: string
          content: string
          is_important: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          title: string
          content: string
          is_important?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          title?: string
          content?: string
          is_important?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 