import type {
  EnvironmentModuleNode,
  FSWatcher,
  ModuleGraph,
  ModuleNode,
  PluginOption,
  ViteDevServer
} from "vite";
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

function createRoutesReloader(
  server: ViteDevServer,
  routes: CompiledRouter,
  environment: "client" | "server"
): () => void {
  routes.addEventListener("reload", handleRoutesReload);
  return () => routes.removeEventListener("reload", handleRoutesReload);

  function handleRoutesReload(): void {
    if (environment === "server") {
      // Handle server environment HMR reload
      const serverEnv = server.environments.server;
      if (serverEnv && serverEnv.moduleGraph) {
        const mod: EnvironmentModuleNode | undefined =
          serverEnv.moduleGraph.getModuleById(moduleId);
        if (mod) {
          const seen = new Set<EnvironmentModuleNode>();
          serverEnv.moduleGraph.invalidateModule(mod, seen);
          // For server environment, we don't use server.reloadModule as it's for client
          // The runner.import will automatically get fresh modules on next request
        }
      }
    } else {
      // Handle client environment HMR reload (existing behavior)
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

export const fileSystemWatcher = (): PluginOption => {
  let closeClient: (() => void) | undefined;
  let closeServer: (() => void) | undefined;

  const plugin: PluginOption = {
    name: "fs-watcher",
    apply: "serve",
    async configureServer(server: ViteDevServer) {
      const router = (globalThis as any).ROUTERS["server"](server.config);
      (globalThis as any).ROUTERS["server"] = router;

      const routerClient = (globalThis as any).ROUTERS["client"](server.config);
      (globalThis as any).ROUTERS["client"] = routerClient;

      // Setup client environment watcher (existing behavior)
      if (routerClient) {
        setupWatcher(server.watcher, routerClient);
        closeClient = createRoutesReloader(server, routerClient, "client");
      }

      // Setup server environment watcher (new functionality)
      if (router) {
        setupWatcher(server.watcher, router);
        closeServer = createRoutesReloader(server, router, "server");
      }
    },
    closeBundle() {
      closeClient?.();
      closeServer?.();
    }
  };
  return plugin;
};
