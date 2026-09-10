import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"
import { assertSupabaseEnv, supabaseCookieOptions } from "@/lib/supabase/env"

export function createClient() {
  const { url, key } = assertSupabaseEnv()
  return createBrowserClient<Database>(url, key, {
    cookieOptions: supabaseCookieOptions,
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}
