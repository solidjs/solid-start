// @refresh skip
// @ts-ignore
import type { Component } from "solid-js";
import { NoHydration, getRequestEvent, ssr } from "solid-js/web";
import { getSsrManifest } from "../manifest/ssr-manifest.ts";

import { TopErrorBoundary } from "../../shared/ErrorBoundary.tsx";
import { renderAsset } from "../renderAsset.tsx";
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
  return (
    <NoHydration>
      {docType as unknown as any}
      <TopErrorBoundary>
        <props.document
          assets={<>{context.assets.map((m: any) => renderAsset(m))}</>}
          scripts={
            <>
              <script
                nonce={nonce}
                innerHTML={`window.manifest = ${JSON.stringify(context.manifest)}`}
              />
              <script
                type="module"
                src={getSsrManifest("client").path(import.meta.env.START_CLIENT_ENTRY)}
              />
            </>
          }
        />
      </TopErrorBoundary>
    </NoHydration>
  );
}
