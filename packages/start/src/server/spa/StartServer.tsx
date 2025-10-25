// @refresh skip
// @ts-ignore
import type { Component } from "solid-js";
import { NoHydration, getRequestEvent, ssr } from "solid-js/web";

import clientAssets from "solid-start:client-entry?assets=client";
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
          scripts={<script type="module" src={clientAssets.entry} />}
        />
      </TopErrorBoundary>
    </NoHydration>
  );
}
