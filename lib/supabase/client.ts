import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Check if we're in a build or server environment
const isBuildOrServer = typeof window === 'undefined'

export const createClient = () => {
  // For server-side rendering and build time, provide a dummy client
  // that won't throw errors when environment variables are missing
  if (isBuildOrServer) {
    return {
      auth: {
        signInWithPassword: async () => ({ data: null, error: new Error('Not available during build') }),
        signOut: async () => ({ error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
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

  // If env vars are missing in browser context, use default values for development
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL or Anon Key not available')
    
    // If we're in a browser context but missing env vars, return a dummy client
    return {
      auth: {
        signInWithPassword: async () => ({ data: null, error: new Error('Configuration missing') }),
        signOut: async () => ({ error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
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

  return createBrowserClient(supabaseUrl, supabaseKey)
}

export const auth = createClient().auth 