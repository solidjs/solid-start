// @refresh skip
// @ts-ignore
import type { Component } from "solid-js";
import { NoHydration, getRequestEvent, ssr } from "solid-js/web";
import { TopErrorBoundary } from "../../shared/ErrorBoundary";
import { renderAsset } from "../renderAsset";
import type { DocumentComponentProps, PageEvent } from "../types";

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
            nonce ? (
              <>
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
