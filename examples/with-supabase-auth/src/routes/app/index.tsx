import { Show } from 'solid-js'
import { useRouteData } from 'solid-start'
import { createServerData$, redirect } from 'solid-start/server'
import { getUserSession, signOut } from '~/db/session.ts'
import styles from './app.module.css'

export function routeData() {
  return createServerData$(async (_, event) => {
    const session = await getUserSession(event.request)

    if (!session) {
      throw redirect('/')
    }

    return session
  })
}

export default function Protected() {
  const session = useRouteData<typeof routeData>()

  console.log('session', session())

  return (
    <Show when={session()} keyed>
      {(us) => (
        <div>
          <header class={styles.header}>
            <h1>Protected Page</h1>

            <button class="round action" onClick={signOut}>
              Sign Out
            </button>
          </header>

          <main class={styles.main}>
            <span>Hey there! You are signed in! Now you can fetch data from Supabase on the server.</span>
          </main>
        </div>
      )}
    </Show>
  )
}
