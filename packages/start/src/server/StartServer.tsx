// @refresh skip
// @ts-ignore
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
import { ErrorBoundary, TopErrorBoundary } from "../shared/ErrorBoundary";
import { renderAsset } from "./renderAsset";
import type { Asset, DocumentComponentProps, PageEvent } from "./types";

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
 *@info flattens, deduplicate by item.attrs.key and returns array of unique items respecting order of initial param.
 */
function dedupeAssets(assets: Asset[][]): Asset[] {
  return [...new Map(assets.flat().map(item => [item.attrs.key, item])).values()];
}

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/server/start-server
 */
export function StartServer(props: { document: Component<DocumentComponentProps> }) {
  const context = getRequestEvent() as PageEvent & { nonce?: string };

  const nonce = context.nonce;

  let assets: Asset[] = [];
  Promise.resolve().then(async () => {
    let assetPromises: Promise<Asset[]>[] = [];
    // @ts-expect-error - context.router is not typed
    if (context.router && context.router.matches) {
      // @ts-expect-error - context.router is not typed
      const matches = [...context.router.matches];
      while (matches.length && (!matches[0].info || !matches[0].info.filesystem)) matches.shift();
      const matched = matches.length && matchRoute(matches, context.routes);
      if (matched) {
        const inputs = import.meta.env.MANIFEST[import.meta.env.START_ISLANDS ? "ssr" : "client"]!
          .inputs;
        for (let i = 0; i < matched.length; i++) {
          const segment = matched[i];
          const part = inputs[segment["$component"].src]!;
          assetPromises.push(part.assets() as any);
        }
      } else if (import.meta.env.DEV) console.warn("No route matched for preloading js assets");
    }
    assets = await Promise.all(assetPromises).then(assetList => {
      if (import.meta.env.START_ISLANDS) {
        return [];
      } else {
        return dedupeAssets(assetList).filter(asset => {
          const assetAttrs = asset.attrs as JSX.LinkHTMLAttributes<HTMLLinkElement>;

          /**
           * @info besides `modulepreload` we also want `stylesheet` to be preloaded during SSR.
           * this will prevent FOUC on the client for non-global CSS.
           */
          const isPreloadOrStylesheet =
            assetAttrs.rel === "modulepreload" || assetAttrs.rel === "stylesheet";

          return (
            isPreloadOrStylesheet &&
            !context.assets.find((a: Asset) => a.attrs.key === asset.attrs.key)
          );
        });
      }
    });
  });

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
            nonce ? (
              <>
                <script
                  nonce={nonce}
                  innerHTML={`window.manifest = ${JSON.stringify(context.manifest)}`}
                />
                <script
                  type="module"
                  nonce={nonce}
                  async
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
                  async
                  src={
                    import.meta.env.MANIFEST["client"]!.inputs[
                      import.meta.env.MANIFEST["client"]!.handler
                    ]!.output.path
                  }
                />
              </>
            )
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
