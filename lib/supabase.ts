import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from './supabase/client';

// We'll export the client from our singleton implementation instead of creating a new one
export const supabase = createClient();

// Export the auth instance from the singleton client
export const auth = supabase.auth;

// Re-export from the client implementation for other modules
export * from './supabase/client' 