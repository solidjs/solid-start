import { type Session } from '@supabase/supabase-js'
import { Show } from 'solid-js'
import { A, Navigate, useRouteData } from 'solid-start'
import { createServerData$ } from 'solid-start/server'
import { getUserSession } from '~/db/session.ts'
import styles from './index.module.css'

export function routeData() {
  return createServerData$(async (_, event) => {
    const sessionJSON = await getUserSession(event.request)
    const session = await sessionJSON.json()
    return session
  })
}

export default function Home() {
  const session = useRouteData<Session>()
  const hasSession = session()

  if (hasSession) {
    return <Navigate href="/app" />
  }

  return (
    <div class={styles.wrapper}>
      <div class={styles.feature}>
        <Show when={hasSession} fallback={
          <A href="./signin">
            Sign in
          </A>
        }>
          <A href="/app">
            Go to app
          </A>
        </Show>

        <main class={styles.main}>
          <h1>Home</h1>
          <p>This is a public home page!</p>
        </main>
      </div>
    </div>
  )
}
