import { Style } from "@solidjs/meta";
import { createResource, Show, Suspense, useContext } from "solid-js";
import type { PageEvent } from "../server";
import { ServerContext } from "../server/ServerContext";

declare global {
  const $ROUTE_LAYOUTS: Record<string, { layouts: any[], id: string }>
}

var routeLayouts = $ROUTE_LAYOUTS;

export { routeLayouts };

const style_pattern = /\.(css|less|sass|scss|styl|stylus|pcss|postcss)$/;

type NotUndefined<T> = T extends undefined ? never : T;

type RouterContext = NotUndefined<PageEvent["routerContext"]>

async function getInlineStyles(env: PageEvent["env"], routerContext: RouterContext) {
  const match = routerContext.matches ? routerContext.matches.reduce((memo: string[], m) => {
    if (m.length) {
      const fullPath = m.reduce((previous, match) => previous + match.originalPath, "");
      if (env.__dev!.manifest!.find(entry => entry.path === fullPath)) {
        memo.push(env.__dev!.manifest!.find(entry => entry.path === fullPath)!.componentPath);
      }
      const route = routeLayouts[fullPath];
      if (route) {
        memo.push(
          ...route.layouts
            .map((key: string) => env.__dev!.manifest!.find(entry => entry.path === key || entry.id === key))
            .filter(entry => entry)
            .map(entry => entry!.componentPath)
        );
      }
    }
    return memo;
  }, []) : [];

  match.push(import.meta.env.START_ENTRY_SERVER);
  const styles = await env.__dev!.collectStyles!(match);
  return styles;
}

export function InlineStyles() {
  const isDev = import.meta.env.MODE === "development";
  const context = useContext(ServerContext);
  if (!isDev || !import.meta.env.START_SSR) {
    return null;
  }

  const [resource] = createResource(
    async () => {
      if (import.meta.env.SSR) {
        return await getInlineStyles(context!.env, context!.routerContext!);
      } else {
        return {};
      }
    },
    {
      deferStream: true
    }
  );

  // We need a space here to prevent the server from collapsing the space between the style tags
  // and making it invalid
  return (
    <Suspense>
      <Show when={resource()} keyed>
        {resource => {
          return (
            <Style>
              {Object.entries(resource)
                .filter(([k]) => style_pattern.test(k))
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
