import { lazy } from "solid-js";
import { useRoutes } from "solid-app-router";
import type { Component } from "solid-js";

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

function findNestedPath(list, id, full, component) {
  let temp = list.find(o => o._id && o._id !== '/' && id.startsWith(o._id + "/"));
  if (!temp)
    list.push({
      _id: id,
      path: toPath(id) || "/",
      component,
      data: data[full] ? data[full].default : undefined
    });
  else
    findNestedPath(
      temp.children || (temp.children = []),
      id.slice(temp._id.length),
      full,
      component
    );
}

const routes = Object.entries(pages).reduce((r, [key, fn]) => {
  let id = toIdentifier(key);
  findNestedPath(
    r,
    id,
    id,
    lazy(
      fn as () => Promise<{
        default: Component<any>;
      }>
    )
  );
  return r;
}, []);

export default useRoutes(routes);
