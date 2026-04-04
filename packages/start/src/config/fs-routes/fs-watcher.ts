import type {
  EnvironmentModuleNode,
  FSWatcher,
  PluginOption,
  ViteDevServer,
} from "vite";
import { VITE_ENVIRONMENTS } from "../constants.ts";
import { moduleId } from "./index.ts";
import type { BaseFileSystemRouter } from "./router.ts";

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

function createRoutesReloader(
  server: ViteDevServer,
  routes: CompiledRouter,
  environment: "client" | "ssr",
): () => void {
  routes.addEventListener("reload", handleRoutesReload);
  return () => routes.removeEventListener("reload", handleRoutesReload);

  function handleRoutesReload(): void {
    const envName =
      environment === "ssr" ? VITE_ENVIRONMENTS.server : VITE_ENVIRONMENTS.client;
    const devEnv = server.environments[envName];
    if (!devEnv?.moduleGraph) return;

    const mod: EnvironmentModuleNode | undefined =
      devEnv.moduleGraph.getModuleById(moduleId);
    if (mod) {
      const seen = new Set<EnvironmentModuleNode>();
      devEnv.moduleGraph.invalidateModule(mod, seen);
    }

    if (environment !== "ssr") {
      if (mod) {
        devEnv.reloadModule(mod);
      } else if (devEnv.hot) {
        devEnv.hot.send({ type: "full-reload" });
      }
    }
  }
}

export const fileSystemWatcher = (
  routers: Record<"client" | "ssr", BaseFileSystemRouter>,
): PluginOption => {
  const plugin: PluginOption = {
    name: "fs-watcher",
    async configureServer(server: ViteDevServer) {
      Object.keys(routers).forEach(environment => {
        const router = (globalThis as any).ROUTERS[environment];
        setupWatcher(server.watcher, router);
        createRoutesReloader(server, router, environment as keyof typeof routers);
      });
    },
  };
  return plugin;
};
