import { createBrowserClient } from '@supabase/auth-helpers-solidstart'

export const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)
