// @ts-ignore
import App from "#start/app";
import type { Component } from "solid-js";
import { Hydration, HydrationScript, NoHydration, getRequestEvent, ssr } from "solid-js/web";
import { ErrorBoundary } from "../shared/ErrorBoundary";
import { renderAsset } from "./renderAsset";
import type { DocumentComponentProps } from "./types";

const docType = ssr("<!DOCTYPE html>");

export function StartServer(props: { document: Component<DocumentComponentProps> }) {
  const context = getRequestEvent() as any;
  return (
    <NoHydration>
      {docType as unknown as any}
      <props.document
        assets={<>{context.assets.map(m => renderAsset(m))}</>}
        scripts={
          <>
            <HydrationScript />
            <script innerHTML={`window.manifest = ${JSON.stringify(context.manifest)}`} />
            <script
              type="module"
              src={
                import.meta.env.MANIFEST["client"].inputs[
                  import.meta.env.MANIFEST["client"].handler
                ].output.path
              }
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
    </NoHydration>
  );
}
