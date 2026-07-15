// @refresh skip
// @ts-ignore
import manifest from "virtual:solid-manifest";
import type { Component } from "solid-js";
import { NoHydration, getRequestEvent, ssr } from "@solidjs/web";
import { join } from "pathe";

import { TopErrorBoundary } from "../../shared/ErrorBoundary.tsx";
import type { DocumentComponentProps, PageEvent } from "../types.ts";

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
          scripts={<script type="module" nonce={nonce} src={clientEntrySrc()} />}
        />
      </TopErrorBoundary>
    </NoHydration>
  );
}
