// @refresh skip
// @ts-ignore
import type { Component } from "solid-js";
import { Hydration, HydrationScript, NoHydration, getRequestEvent, ssr } from "solid-js/web";
import { getSsrManifest } from "../manifest/ssr-manifest.ts";

import { TopErrorBoundary } from "../../shared/ErrorBoundary.tsx";
import { useAssets } from "../assets/index.ts";
import PatchVirtualDevStyles from "../assets/PatchVirtualDevStyles.tsx";
import { InitialData } from "./initial-data.ts";
import type { DocumentComponentProps, PageEvent } from "../types.ts";

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
          assets={
            import.meta.env.START_SSR_DATA ? (
              // Defines `_$HY.r` for the streamed data. Nothing hydrates, so it
              // doesn't need to capture events for replay. The client types
              // don't list `eventNames`, the server implementation takes it.
              // @ts-expect-error
              <HydrationScript eventNames={[]} />
            ) : undefined
          }
          scripts={
            <>
              <PatchVirtualDevStyles nonce={nonce} />
              {import.meta.env.START_SSR_DATA && (
                <Hydration>
                  <InitialData />
                </Hydration>
              )}
              <script
                type="module"
                nonce={nonce}
                src={getSsrManifest("client").path(import.meta.env.START_CLIENT_ENTRY_URL)}
              />
            </>
          }
        />
      </TopErrorBoundary>
    </NoHydration>
  );
}
