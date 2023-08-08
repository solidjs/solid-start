import { Style } from "@solidjs/meta";
import { createResource, Show, Suspense } from "solid-js";
import type { PageEvent } from "../server";
import { useRequest } from "../server/ServerContext";
import { routeLayouts } from "./routeLayouts";

const style_pattern = /\.(css|less|sass|scss|styl|stylus|pcss|postcss)$/;

type NotUndefined<T> = T extends undefined ? never : T;

type RouterContext = NotUndefined<PageEvent["routerContext"]>

async function getInlineStyles(env: PageEvent["env"], routerContext: RouterContext) {
  const match = routerContext.matches ? routerContext.matches.reduce((memo: string[], m) => {
    if (m.length) {
      const fullPath = m.reduce((previous, match) => previous + match.originalPath, "");
      if (env.__dev?.manifest?.find(entry => entry.path === fullPath)) {
        memo.push(env.__dev.manifest.find(entry => entry.path === fullPath)!.componentPath);
      }
      const route = routeLayouts[fullPath];
      if (route) {
        memo.push(
          ...route.layouts
            .map(key => env.__dev?.manifest?.find(entry => entry.path === key || entry.id === key))
            .filter(entry => entry)
            .map(entry => entry!.componentPath)
        );
      }
    }
    return memo;
  }, []) : [];

  match.push(import.meta.env.START_ENTRY_SERVER);
  const styles = await env.__dev?.collectStyles?.(match);
  return styles;
}

let warned = false;

export function InlineStyles() {
  const isDev = import.meta.env.MODE === "development";
  const context = useRequest();
  if (!isDev || !import.meta.env.START_SSR) {
    return null;
  }

  if (import.meta.env.START_SSR === "sync") {
    if (!warned) {
      _$DEBUG(
        "In sync SSR mode, the CSS will be loaded lazily during development. You might see a flash of unstyled content. Don't worry, this will not happen in production. To avoid this, use async or streaming SSR."
      );
    }
    warned = true;
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
