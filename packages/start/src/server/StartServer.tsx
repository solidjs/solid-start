// @refresh skip
import App from "#start/app";
import type { Component, JSX } from "solid-js";
import {
  Hydration,
  HydrationScript,
  NoHydration,
  getRequestEvent,
  ssr,
  useAssets
} from "solid-js/web";

import { ErrorBoundary, TopErrorBoundary } from "../shared/ErrorBoundary.tsx";
import { renderAsset } from "./renderAsset.tsx";
import type { Asset, DocumentComponentProps, PageEvent } from "./types.js";
import { getSsrManifest } from "./manifest/ssr-manifest.ts";

const docType = ssr("<!DOCTYPE html>");

function matchRoute(matches: any[], routes: any[], matched = []): any[] | undefined {
  for (let i = 0; i < routes.length; i++) {
    const segment = routes[i];
    if (segment.path !== matches[0].path) continue;
    let next: any = [...matched, segment];
    if (segment.children) {
      const nextMatches = matches.slice(1);
      if (nextMatches.length === 0) continue;
      next = matchRoute(nextMatches, segment.children, next);
      if (!next) continue;
    }
    return next;
  }
}

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/server/start-server
 */
export function StartServer(props: { document: Component<DocumentComponentProps> }) {
  const context = getRequestEvent() as PageEvent;
  // @ts-ignore
  const nonce = context.nonce;

  let assets: Asset[] = [];
  Promise.resolve()
    .then(async () => {
      const manifest = getSsrManifest(import.meta.env.START_ISLANDS);

      let assetPromises: Promise<Asset[]>[] = [];
      // @ts-ignore
      if (context.router && context.router.matches) {
        // @ts-ignore
        const matches = [...context.router.matches];
        while (matches.length && (!matches[0].info || !matches[0].info.filesystem)) matches.shift();
        const matched = matches.length && matchRoute(matches, context.routes);
        if (matched) {
          for (let i = 0; i < matched.length; i++) {
            const segment = matched[i];
            assetPromises.push(manifest.getAssets(segment["$component"].src));
          }
        } else if (import.meta.env.DEV) console.warn("No route matched for preloading js assets");
      }
      assets = await Promise.all(assetPromises).then(a =>
        // dedupe assets
        [...new Map(a.flat().map(item => [item.attrs.key, item])).values()].filter(asset =>
          import.meta.env.START_ISLANDS
            ? false
            : (asset.attrs as JSX.LinkHTMLAttributes<HTMLLinkElement>).rel === "modulepreload" &&
              !context.assets.find((a: Asset) => a.attrs.key === asset.attrs.key)
        )
      );
    })
    .catch(console.error);

  useAssets(() => (assets.length ? assets.map(m => renderAsset(m)) : undefined));

  return (
    <NoHydration>
      {docType as unknown as any}
      <TopErrorBoundary>
        <props.document
          assets={
            <>
              <HydrationScript />
              {context.assets.map((m: any) => renderAsset(m, nonce))}
            </>
          }
          scripts={
            <>
              <script
                nonce={nonce}
                innerHTML={`window.manifest = ${JSON.stringify(context.manifest)}`}
              />
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
