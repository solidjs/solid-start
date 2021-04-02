import { lazy } from "solid-js";
import { RouteDefinition } from "solid-app-router";

const dataModules = import.meta.globEager("/src/pages/**/*.data.(js|ts)");
const pages = import.meta.glob("/src/pages/**/*.(jsx|tsx)");

function toIdentifier(source: string) {
  return source.slice(10).replace(/(index)?(.jsx|.tsx|.data.js|.data.ts)/, "");
}

function toPath(id: string) {
  return id.replace(/\[(.+)\]/, (_, m) => (m.startsWith("...") ? `*${m.slice(3)}` : `:${m}`));
}

const data = Object.entries(dataModules).reduce((memo, [key, value]) => {
  memo[toIdentifier(key)] = value;
  return memo;
}, {});

export const routes: RouteDefinition[] = Object.entries(pages).map(([key, fn]) => {
  const id = toIdentifier(key);
  return {
    path: toPath(id),
    component: lazy(fn as any),
    data: data[id] ? data[id].default : undefined
  };
});
