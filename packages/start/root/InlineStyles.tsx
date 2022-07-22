import { createResource, Show, Suspense, useContext } from "solid-js";
import { Style } from "solid-meta";
import type { PageEvent } from "../server";
import { ServerContext } from "../server/ServerContext";
import { routeLayouts } from "./FileRoutes";

async function getInlineStyles(env: PageEvent["env"], routerContext: PageEvent["routerContext"]) {
  const match = routerContext.matches.reduce((memo: string[], m) => {
    if (m.length) {
      const fullPath = m.reduce((previous, match) => previous + match.originalPath, "");
      if (env.devManifest.find(entry => entry.path === fullPath)) {
        memo.push(env.devManifest.find(entry => entry.path === fullPath)!.componentPath);
      }
      const route = routeLayouts[fullPath];
      if (route) {
        memo.push(
          ...route.layouts
            .map(key => env.devManifest.find(entry => entry.path === key || entry.id === key))
            .filter(entry => entry)
            .map(entry => entry!.componentPath)
        );
      }
    }
    return memo;
  }, []);

  match.push("src/entry-server.tsx");
  const styles = await env.collectStyles(match);
  return styles;
}

export function InlineStyles() {
  const isDev = import.meta.env.MODE === "development";
  const context = useContext(ServerContext);
  if (!isDev || !import.meta.env.START_SSR) {
    return null;
  }

  const [resource] = createResource(() => getInlineStyles(context.env, context.routerContext), {
    deferStream: true
  });

  // We need a space here to prevent the server from collapsing the space between the style tags
  // and making it invalid
  return (
    <Suspense>
      <Show when={resource()}>
        {resource => {
          return (
            <Style>
              {Object.entries(resource)
                .filter(([k]) => k.endsWith(".css"))
                .map(([k, v]) => {
                  return `/* ${k} */\n` + v;
                })
                .join("\n") + " "}
            </Style>
          );
        }}
      </Show>
    </Suspense>
  );
}
