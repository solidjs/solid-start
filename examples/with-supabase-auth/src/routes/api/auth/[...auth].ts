import { createServerClient } from '@supabase/auth-helpers-remix'
import { redirect, type APIEvent } from 'solid-start'

export async function GET(event: APIEvent) {
  const response = new Response()
  const url = new URL(event.request.url)
  const code = url.searchParams.get('code')

  if (code) {
    const supabaseServer = createServerClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_KEY,
      { request: event.request, response }
    )
    await supabaseServer.auth.exchangeCodeForSession(code)
  }

  return redirect('/app', {
    headers: response.headers,
  })
}
