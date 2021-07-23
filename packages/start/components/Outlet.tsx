import { lazy, Component } from "solid-js";
import { useRoutes } from "solid-app-router";

const dataModules = import.meta.globEager("/src/pages/**/*.data.(js|ts)");
const pages = import.meta.glob("/src/pages/**/*.(jsx|tsx)");

function toIdentifier(source) {
  return source.slice(10).replace(/(index)?(.jsx|.tsx|.data.js|.data.ts)/, "");
}

function toPath(id) {
  return id.replace(/\[(.+)\]/, (_, m) => (m.startsWith("...") ? `*${m.slice(3)}` : `:${m}`));
}

const data = Object.entries(dataModules).reduce((memo, [key, value]) => {
  memo[toIdentifier(key)] = value;
  return memo;
}, {});

const routes = Object.entries(pages).map(([key, fn]) => {
  const id = toIdentifier(key);
  return {
    path: toPath(id),
    component: lazy(
      fn as () => Promise<{
        default: Component<any>;
      }>
    ),
    data: data[id] ? data[id].default : undefined
  };
});

export default function Outlet() {
  return useRoutes(routes);
}