// @refresh skip
import manifest from "virtual:solid-manifest";
import type { Component } from "solid-js";
import { Hydration, HydrationScript, NoHydration, getRequestEvent, ssr } from "@solidjs/web";
import { join } from "pathe";
import App from "solid-start:app";

import { ErrorBoundary, TopErrorBoundary } from "../shared/ErrorBoundary.tsx";
import type { DocumentComponentProps, PageEvent } from "./types.ts";

const docType = ssr("<!DOCTYPE html>");

function clientEntrySrc() {
  const key = import.meta.env.START_CLIENT_ENTRY.replace(/^\.\//, "");
  if (import.meta.env.DEV) return join(import.meta.env.BASE_URL || "/", key);
  const entry = (manifest as Record<string, any>)[key];
  if (!entry) throw new Error(`No entry found in client manifest for '${key}'`);
  return join(import.meta.env.BASE_URL || "/", entry.file);
}

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/server/start-server
 */
export function StartServer(props: { document: Component<DocumentComponentProps> }) {
  const context = getRequestEvent() as PageEvent;

  // @ts-ignore
  const nonce = context.nonce;

  return (
    <NoHydration>
      {docType as unknown as any}
      <TopErrorBoundary>
        <props.document
          assets={<HydrationScript />}
          scripts={
            <>
              {import.meta.env.DEV && (
                // Reconciles SSR'd <style data-vite-dev-id> tags with Vite's
                // HMR client (virtual-id rewriting + twin dedupe). Inline so
                // it runs before any module script.
                <script nonce={nonce} innerHTML={import.meta.env.START_DEV_STYLE_PATCH} />
              )}
              <script type="module" nonce={nonce} async src={clientEntrySrc()} />
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
