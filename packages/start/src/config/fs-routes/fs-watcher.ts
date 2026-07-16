import type { EnvironmentModuleNode, FSWatcher, PluginOption, ViteDevServer } from "vite";
import { debounce } from "../../utils/debounce.ts";
import { VITE_ENVIRONMENTS } from "../constants.ts";
import { moduleId } from "./index.ts";
import type { BaseFileSystemRouter } from "./router.ts";

function setupWatcher(watcher: FSWatcher, routes: BaseFileSystemRouter): void {
  watcher.on("unlink", path => routes.removeRoute(path));
  watcher.on("add", path => routes.addRoute(path));
  watcher.on("change", path => routes.updateRoute(path));
}

function createRoutesReloader(
  server: ViteDevServer,
  routes: BaseFileSystemRouter,
  environment: "client" | "ssr",
) {
  const devEnv = server.environments[environment]!;
  if (!devEnv?.moduleGraph) return;

  /**
   * Debounce catches multiple route changes in a row
   * Short timeout for inexpensive invalidations
   */
  const invalidateModule = debounce((mod: EnvironmentModuleNode) => {
    devEnv.moduleGraph.invalidateModule(mod);
  }, 0);

  /**
   * Long debounce timeout for expensive reloads
   */
  const reloadModule = debounce((mod: EnvironmentModuleNode) => {
    devEnv.reloadModule(mod);
  }, 200);

  return routes.on("reload", function handleRoutesReload(evt): void {
    const mod = devEnv.moduleGraph.getModuleById(moduleId)!;
    if (!mod) {
      devEnv.hot.send({ type: "full-reload" });
      return;
    }

    if (environment === VITE_ENVIRONMENTS.client && evt.detail.type !== "update") {
      // Client has to be reloaded when routes are added or removed
      reloadModule(mod);
    } else {
      invalidateModule(mod);
    }
  });
}

export const fileSystemWatcher = (
  routers: Record<"client" | "ssr", BaseFileSystemRouter>,
): PluginOption => {
  const plugin: PluginOption = {
    name: "fs-watcher",
    async configureServer(server: ViteDevServer) {
      for (const environment of [VITE_ENVIRONMENTS.server, VITE_ENVIRONMENTS.client]) {
        const router = routers[environment];
        setupWatcher(server.watcher, router);
        createRoutesReloader(server, router, environment);
      }
    },
  };
  return plugin;
};
