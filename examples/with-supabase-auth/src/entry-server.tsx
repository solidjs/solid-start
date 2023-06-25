import {
  createHandler,
  renderAsync,
  StartServer,
} from 'solid-start/entry-server'
import { redirect } from 'solid-start/server'
import { getUserSession } from './db/session.ts'

const protectedRoute = () => ['/app']

export default createHandler(
  ({ forward }) => {
    return async (event) => {
      const { pathname } = new URL(event.request.url)
      const isProtected = protectedRoute().includes(pathname)

      if (isProtected) {
        const sessionJSON = await getUserSession(event.request)
        const session = await sessionJSON.json()

        if (!session) {
          return redirect('/')
        }
      }

      return forward(event)
    }
  },

  renderAsync((event) => <StartServer event={event} />)
)
