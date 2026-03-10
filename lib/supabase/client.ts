import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // During static build, env vars are not available — return a dummy client
    // that won't be used (Client Components only run in the browser)
    return createBrowserClient('https://placeholder.supabase.co', 'placeholder')
  }

  client = createBrowserClient(url, key)

  return client
}
