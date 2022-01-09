// This file is used a virtual module to load the data and pages using glob imports,
// then processing them into a format that is compatible with the solid-app-router
// useRoutes hook
import { lazy } from "solid-js";

import dataModules from "virtual:solid-start/data";
import pages from "virtual:solid-start/pages";

function toIdentifier(source) {
  // $EXTENSIONS will be replaced by the extensions list
  // by the solid-start vite plugin
  return source.slice(10).replace(/(index)?($EXTENSIONS|.data.js|.data.ts)/, "");
}

function toPath(id) {
  return id.replace(/\[(.+)\]/, (_, m) => (m.startsWith("...") ? `*${m.slice(3)}` : `:${m}`));
}

const data = Object.entries(dataModules).reduce((memo, [key, value]) => {
  memo[toIdentifier(key)] = value;
  return memo;
}, {});

function findNestedPath(list, id, full, component) {
  let temp = list.find(o => o._id && o._id !== "/" && id.startsWith(o._id + "/"));
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
  findNestedPath(r, id, id, lazy(fn));
  return r;
}, []);

export default routes;
