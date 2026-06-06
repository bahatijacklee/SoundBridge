import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      '[v0] Warning: Supabase environment variables are not set.',
    )
    throw new Error(
      'Supabase URL and key are required. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in your environment.',
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
