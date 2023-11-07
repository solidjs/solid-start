// @ts-ignore
import App from "#start/app";
import { Router } from "@solidjs/router";
import { join } from "path";
import { Hydration, HydrationScript, NoHydration, ssr } from "solid-js/web";
import { renderAsset } from "./renderAsset";

const docType = ssr("<!DOCTYPE html>");

export function StartServer(props) {
  const context = props.context;
  const parsed = new URL(context.request.url);
  const path = parsed.pathname + parsed.search;
  return (
    <Router
      out={context.routerContext}
      url={join(import.meta.env.BASE_URL, path)}
      base={import.meta.env.BASE_URL}
    >
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
              <App />
            </Hydration>
          ) : (
            <App />
          )}
        </props.document>
      </NoHydration>
    </Router>
  );
}
