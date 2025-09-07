import type {
  EnvironmentModuleNode,
  FSWatcher,
  ModuleGraph,
  ModuleNode,
  PluginOption,
  ViteDevServer
} from "vite";
import { moduleId } from "./index.js";
import { BaseFileSystemRouter } from "./router.js";

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
  environment: "client" | "ssr"
): () => void {
  routes.addEventListener("reload", handleRoutesReload);
  return () => routes.removeEventListener("reload", handleRoutesReload);

  function handleRoutesReload(): void {
    if (environment === "ssr") {
      // Handle server environment HMR reload
      const serverEnv = server.environments.server;
      if (serverEnv && serverEnv.moduleGraph) {
        const mod: EnvironmentModuleNode | undefined =
          serverEnv.moduleGraph.getModuleById(moduleId);
        if (mod) {
          const seen = new Set<EnvironmentModuleNode>();
          serverEnv.moduleGraph.invalidateModule(mod, seen);
        }
      }
    } else {
      // Handle client environment HMR reload
      const { moduleGraph }: { moduleGraph: ModuleGraph } = server;
      const mod: ModuleNode | undefined = moduleGraph.getModuleById(moduleId);
      if (mod) {
        const seen = new Set<ModuleNode>();
        moduleGraph.invalidateModule(mod, seen);
        server.reloadModule(mod);
      }
    }

    if (!server.config.server.hmr) {
      server.ws.send({ type: "full-reload" });
    }
  }
}

export const fileSystemWatcher = (
  routers: Record<"client" | "ssr", BaseFileSystemRouter>
): PluginOption => {
  const plugin: PluginOption = {
    name: "fs-watcher",
    async configureServer(server: ViteDevServer) {
      Object.keys(routers).forEach(environment => {
        const router = (globalThis as any).ROUTERS[environment];
        setupWatcher(server.watcher, router);
        createRoutesReloader(server, router, environment as keyof typeof routers);
      });
    }
  };
  return plugin;
};
