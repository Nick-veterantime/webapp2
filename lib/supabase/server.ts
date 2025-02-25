import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// Check if we're in a build environment
const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV === 'production'

// Track request-scoped instances
const instances = new Map()

export const createClient = () => {
  // In a server environment, we need to create a new instance for each request
  // But we can still deduplicate within the same request context
  const requestId = Symbol('requestId')
  if (instances.has(requestId)) {
    return instances.get(requestId)
  }

  // For build time, provide a dummy client that won't throw errors
  if (isBuildTime) {
    const dummyClient = {
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
    
    instances.set(requestId, dummyClient)
    return dummyClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fallback for missing env vars
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or Anon Key not available for server')
    
    const fallbackClient = {
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
    
    instances.set(requestId, fallbackClient)
    return fallbackClient
  }

  try {
    const cookieStore = cookies()
    
    const client = createServerClient(
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
    
    instances.set(requestId, client)
    return client
  } catch (error) {
    // Fallback for any errors during initialization
    console.error('Error initializing Supabase server client:', error)
    const errorClient = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
      },
      from: () => ({})
    } as any
    
    instances.set(requestId, errorClient)
    return errorClient
  }
} 