// @ts-ignore
import App from "#start/app";
import { MetaProvider, renderTags } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { renderAsset } from "@vinxi/solid";
import { join } from "path";
import { useContext } from "solid-js";
import { Hydration, HydrationScript, NoHydration, ssr, useAssets } from "solid-js/web";

import { ServerContext } from "../shared/ServerContext";

function Meta() {
  const context = useContext(ServerContext);
  useAssets(() => ssr(renderTags(context.tags)) as any);
  return null;
}

const docType = ssr("<!DOCTYPE html>");

export function StartServer(props) {
  const context = props.context;
  const parsed = new URL(context.request.url);
  const path = parsed.pathname + parsed.search;
  return (
    <ServerContext.Provider value={context}>
      <MetaProvider tags={context.tags}>
        <Router
          out={context.routerContext}
          url={join(import.meta.env.BASE_URL, path)}
          base={import.meta.env.BASE_URL}
        >
          <NoHydration>
            {docType as unknown as any}
            <props.document
              assets={
                <>
                  <Meta />
                  {context.assets.map(m => renderAsset(m))}
                </>
              }
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
                  <App />
                </Hydration>
              ) : (
                <App />
              )}
            </props.document>
          </NoHydration>
        </Router>
      </MetaProvider>
    </ServerContext.Provider>
  );
}
