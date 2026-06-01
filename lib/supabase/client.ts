import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      '[v0] Warning: Supabase environment variables are not set. Check your .env.local file.',
    )
    throw new Error(
      'Supabase URL and publishable key are required. Check your environment variables.',
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
