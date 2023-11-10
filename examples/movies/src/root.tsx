// @refresh reload
import { Suspense } from "solid-js";
import {
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title
} from "solid-start";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import GlobalLoader from "./components/GlobalLoader";
import "~/assets/css/global.scss";

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>Solid Movies</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Body>
        <ErrorBoundary>
          <GlobalLoader />
          <Nav />
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <FileRoutes />
            </Routes>
            <Footer />
          </Suspense>
        </ErrorBoundary>
        <Scripts />
      </Body>
    </Html>
  );
}
