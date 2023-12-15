// @ts-ignore
import App from "#start/app";
import type { Component } from "solid-js";
import {
  Hydration,
  HydrationScript,
  NoHydration,
  getRequestEvent,
  ssr,
  useAssets
} from "solid-js/web";
import { ErrorBoundary } from "../shared/ErrorBoundary";
import { renderAsset } from "./renderAsset";
import type { DocumentComponentProps } from "./types";

const docType = ssr("<!DOCTYPE html>");

export function StartServer(props: { document: Component<DocumentComponentProps> }) {
  const context = getRequestEvent() as any;

  let assets = [];
  Promise.resolve().then(async () => {
    let current = context.routes;
    if (context.routerMatches[0]) {
      for (let i = 0; i < context.routerMatches[0].length; i++) {
        const match = context.routerMatches[0][i];
        if (match.metadata && match.metadata.filesystem) {
          const segment = current.find(r => r.path === match.path);
          const part = import.meta.env.MANIFEST["client"].inputs[segment["$component"].src];
          const asset = await part.assets();
          assets.push.apply(assets, asset);
          current = segment.children;
        }
      }
    }
    // dedupe assets
    assets = [...new Map(assets.map(item => [item.attrs.key, item])).values()].filter(
      asset =>
        asset.attrs.rel === "modulepreload" &&
        !context.assets.find(a => a.attrs.key === asset.attrs.key)
    );
  });

  useAssets(() => assets.map(m => renderAsset(m)));

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
