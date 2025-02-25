import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// Check if we're in a build environment
const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV === 'production'

export const createClient = () => {
  // For build time, provide a dummy client that won't throw errors
  if (isBuildTime) {
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => null,
            data: null,
            error: null
          })
        })
      })
    } as any
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fallback for missing env vars
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or Anon Key not available for server')
    
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => null,
            data: null,
            error: null
          })
        })
      })
    } as any
  }

  try {
    const cookieStore = cookies()
    
    return createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Handle cookies during static site generation
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Handle cookies during static site generation
            }
          },
        },
      }
    )
  } catch (error) {
    // Fallback for any errors during initialization
    console.error('Error initializing Supabase server client:', error)
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
      },
      from: () => ({})
    } as any
  }
} 