// @refresh skip
// @ts-ignore
import type { Component } from "solid-js";
import { Hydration, HydrationScript, NoHydration, getRequestEvent, ssr } from "solid-js/web";
import { TopErrorBoundary } from "../../shared/ErrorBoundary";
import { renderAsset } from "../renderAsset";
import type { DocumentComponentProps, PageEvent } from "../types";
import { InitialData } from "./initial-data";

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
          assets={
            <>
              {import.meta.env.START_SSR_DATA && (
                // Defines `_$HY.r` for the streamed data. Nothing hydrates, so
                // it doesn't need to capture events for replay. The client
                // types don't list `eventNames`, the server implementation
                // takes it.
                // @ts-ignore
                <HydrationScript eventNames={[]} />
              )}
              {context.assets.map((m: any) => renderAsset(m))}
            </>
          }
          scripts={
            nonce ? (
              <>
                {import.meta.env.START_SSR_DATA && (
                  <Hydration>
                    <InitialData />
                  </Hydration>
                )}
                <script
                  nonce={nonce}
                  innerHTML={`window.manifest = ${JSON.stringify(context.manifest)}`}
                />
                <script
                  type="module"
                  src={
                    import.meta.env.MANIFEST["client"]!.inputs[
                      import.meta.env.MANIFEST["client"]!.handler
                    ]!.output.path
                  }
                />
              </>
            ) : (
              <>
                {import.meta.env.START_SSR_DATA && (
                  <Hydration>
                    <InitialData />
                  </Hydration>
                )}
                <script innerHTML={`window.manifest = ${JSON.stringify(context.manifest)}`} />
                <script
                  type="module"
                  src={
                    import.meta.env.MANIFEST["client"]!.inputs[
                      import.meta.env.MANIFEST["client"]!.handler
                    ]!.output.path
                  }
                />
              </>
            )
          }
        />
      </TopErrorBoundary>
    </NoHydration>
  );
}
