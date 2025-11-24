// @refresh skip
import type { Component } from "solid-js";
import { Hydration, HydrationScript, NoHydration, getRequestEvent, ssr } from "solid-js/web";
import App from "solid-start:app";

import { ErrorBoundary, TopErrorBoundary } from "../shared/ErrorBoundary.tsx";
import { useAssets } from "./assets/index.ts";
import { getSsrManifest } from "./manifest/ssr-manifest.ts";
import type { DocumentComponentProps, PageEvent } from "./types.ts";

const docType = ssr("<!DOCTYPE html>");

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/server/start-server
 */
export function StartServer(props: { document: Component<DocumentComponentProps> }) {
  const context = getRequestEvent() as PageEvent;

  // @ts-ignore
  const nonce = context.nonce;
  useAssets(context.assets, nonce);

  return (
    <NoHydration>
      {docType as unknown as any}
      <TopErrorBoundary>
        <props.document
          assets={<HydrationScript />}
          scripts={
            <>
              <script
                type="module"
                nonce={nonce}
                async
                src={getSsrManifest("client").path(import.meta.env.START_CLIENT_ENTRY)}
              />
            </>
          }
        >
          {!import.meta.env.START_ISLANDS ? (
            <Hydration>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </Hydration>
          ) : (
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          )}
        </props.document>
      </TopErrorBoundary>
    </NoHydration>
  );
}
