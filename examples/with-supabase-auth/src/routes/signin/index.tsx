import { type Provider } from '@supabase/supabase-js'
import { Show } from 'solid-js'
import { createRouteAction } from 'solid-start'
import { signInWithMagicLink, signInWithProvider } from '~/db/session'
import styles from './signin.module.css'

export default function Signin() {
  const [submission, { Form }] = createRouteAction(async (form: FormData) => {
    const intent = form.get('intent')

    if (intent === 'magicLink') {
      signInWithMagicLink(form.get('email') as string)
      return 'magicLink'
    } else {
      return signInWithProvider(intent as Provider)
    }
  })

  return (
    <div class={styles.wrapper}>
      <h1>Welcome Back!</h1>
      <p>It's so good to see you again.</p>

      <div class={styles.flex}>
        <Show when={submission.error}>
          <div>
            <p>Something went wrong: {submission.error.message}</p>
          </div>
        </Show>

        <Show when={submission.result === 'magicLink'} fallback={null}>
          <div>
            <p>Check your email for a magic link!</p>
          </div>
        </Show>

        <Form class={styles.formWrapper}>
          <label html-for="email">Email</label>
          <input type="hidden" name="intent" value="magicLink" />
          <input type="tel" id="email" name="email" />
          <button disabled={submission.pending} type="submit">
            Sign in
          </button>
        </Form>
      </div>

      <br />

      <div>
        <Form>
          <input type="hidden" name="intent" value="google" />
          <button disabled={submission.pending} type="submit">
            Sign in with Google
          </button>
        </Form>

        <br />

        <Form>
          <input type="hidden" name="intent" value="discord" />
          <button disabled={submission.pending} type="submit">
            Sign in with Discord
          </button>
        </Form>
      </div>
    </div>
  )
}
