// @refresh reload
import { A, Routes } from "@solidjs/router";
import { DefaultErrorBoundary, FileRoutes } from "@solidjs/start";
import { Suspense } from "solid-js";

import { useAssets } from "solid-js/web";

import { css, renderSheets, StyleRegistry, type StyleData } from "solid-styled";

function GlobalStyles() {
  css`
    @global {
      body {
        font-family: Gordita, Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue",
          sans-serif;
      }

      a {
        margin-right: 1rem;
      }

      main {
        text-align: center;
        padding: 1em;
        margin: 0 auto;
      }

      h1 {
        color: #335d92;
        text-transform: uppercase;
        font-size: 4rem;
        font-weight: 100;
        line-height: 1.1;
        margin: 4rem auto;
        max-width: 14rem;
      }

      p {
        max-width: 14rem;
        margin: 2rem auto;
        line-height: 1.35;
      }

      @media (min-width: 480px) {
        h1 {
          max-width: none;
        }

        p {
          max-width: none;
        }
      }
    }
  `;
  return null;
}

export default function App() {
  const sheets: StyleData[] = [];
  useAssets(() => renderSheets(sheets));

  return (
    <StyleRegistry styles={sheets}>
      <GlobalStyles />
      <A href="/">Index</A>
      <A href="/about">About</A>
      <DefaultErrorBoundary>
        <Suspense>
          <Routes>
            <FileRoutes />
          </Routes>
        </Suspense>
      </DefaultErrorBoundary>
    </StyleRegistry>
  );
}
