// @ts-ignore
import { Router } from "@solidjs/router";
import { join } from "path";
import { NoHydration, ssr } from "solid-js/web";
import { renderAsset } from "../renderAsset";

import { ServerContext } from "../../shared/ServerContext";

const docType = ssr("<!DOCTYPE html>");

export function StartServer(props) {
  const context = props.context;
  const parsed = new URL(context.request.url);
  const path = parsed.pathname + parsed.search;
  return (
    <ServerContext.Provider value={context}>
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
          ></props.document>
        </NoHydration>
      </Router>
    </ServerContext.Provider>
  );
}
