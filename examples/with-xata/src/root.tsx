// @refresh reload
import { Suspense } from 'solid-js'
import {
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
} from 'solid-start'
import './root.css'

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>SolidStart - With Xata</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="SolidStart + Xata template." />

        <meta
          property="og:image"
          content={`${process.env.VERCEL_URL}/og.jpg`}
        />
        <meta property="og:title" content="SolidStart - With Xata" />
        <meta property="og:description" content="SolidStart + Xata template." />
        <meta property="og:type" content="website" />

        <meta
          property="twitter:image"
          content={`${process.env.VERCEL_URL}/og.png`}
        />
        <meta property="twitter:title" content="SolidStart - With Xata" />
        <meta
          property="twitter:description"
          content="SolidStart + Xata template."
        />
        <meta property="twitter:card" content="summary_large_image" />
      </Head>
      <Body>
        <Suspense>
          <ErrorBoundary>
            <Routes>
              <FileRoutes />
            </Routes>
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  )
}
