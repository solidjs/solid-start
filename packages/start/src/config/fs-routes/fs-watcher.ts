import type { FSWatcher, ModuleGraph, ModuleNode, PluginOption, ViteDevServer } from "vite";
import { moduleId } from "./index.js";

interface CompiledRouter {
  removeRoute(path: string): void;
  addRoute(path: string): void;
  updateRoute(path: string): void;
  addEventListener(event: "reload", handler: () => void): void;
  removeEventListener(event: "reload", handler: () => void): void;
}

function setupWatcher(watcher: FSWatcher, routes: CompiledRouter): void {
  watcher.on("unlink", path => routes.removeRoute(path));
  watcher.on("add", path => routes.addRoute(path));
  watcher.on("change", path => routes.updateRoute(path));
}

function createRoutesReloader(server: ViteDevServer, routes: CompiledRouter): () => void {
  routes.addEventListener("reload", handleRoutesReload);
  return () => routes.removeEventListener("reload", handleRoutesReload);

  function handleRoutesReload(): void {
    const { moduleGraph }: { moduleGraph: ModuleGraph } = server;
    const mod: ModuleNode | undefined = moduleGraph.getModuleById(moduleId);
    if (mod) {
      const seen = new Set<ModuleNode>();
      moduleGraph.invalidateModule(mod, seen);
      server.reloadModule(mod);
    }
    if (!server.config.server.hmr) {
      server.ws.send({ type: "full-reload" });
    }
  }
}

export const fileSystemWatcher = (): PluginOption => {
  let close: (() => void) | undefined;

  const plugin: PluginOption = {
    name: "fs-watcher",
    apply: "serve",
    async configureServer(server: ViteDevServer) {
      const router = (globalThis as any).ROUTERS["server"](server.config);
      (globalThis as any).ROUTERS["server"] = router;

      const routerClient = (globalThis as any).ROUTERS["client"](server.config);
      (globalThis as any).ROUTERS["client"] = routerClient;

      if (router) {
        setupWatcher(server.watcher, router);
        close = createRoutesReloader(server, router);
      }
    },
    closeBundle() {
      close?.();
    }
  };
  return plugin;
};
