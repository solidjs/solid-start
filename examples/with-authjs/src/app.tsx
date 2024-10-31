// @refresh reload
import { MetaProvider, Title } from '@solidjs/meta'
import { Router } from '@solidjs/router'
import { FileRoutes } from '@solidjs/start/router'
import { Suspense } from 'solid-js'
import './app.css'
import { SessionProvider } from '@solid-mediakit/auth/client'

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>Create JD APP</Title>
          <Suspense>
            <SessionProvider>{props.children} </SessionProvider>
          </Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  )
}
