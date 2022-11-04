import { createContext, JSX, useContext } from "solid-js";
import { ssr } from "solid-js/web";
import { getAssetsFromManifest } from "../root/assets";
import { useRequest } from "../server/ServerContext";
export interface RouteDefinition {
  path: string;
  component?: () => JSX.Element;
  children?: RouteDefinition | RouteDefinition[];
  data?: any;
}

export type Params = Record<string, string>;

export interface PathMatch {
  params: Params;
  path: string;
}

export interface MatchedRoute {
  id: string;
  originalPath: string;
  pattern: string;
  component: (props: any) => JSX.Element;
  children?: RouteDefinition | RouteDefinition[];
  match: PathMatch;
  data?: any;
  shared: boolean;
}

export interface Branch {
  routes: MatchedRoute[];
  score: number;
}

const hasSchemeRegex = /*#__PURE__*/ /^(?:[a-z0-9]+:)?\/\//i;
const trimPathRegex = /*#__PURE__*/ /^\/+|\/+$|\s+/g;

function normalize(path: string) {
  const s = path.replace(trimPathRegex, "");
  return s ? (s.startsWith("?") ? s : "/" + s) : "";
}

export function resolvePath(base: string, path: string, from?: string): string | undefined {
  if (hasSchemeRegex.test(path)) {
    return undefined;
  }
  const basePath = normalize(base);
  const fromPath = from && normalize(from);
  let result = "";
  if (!fromPath || path.charAt(0) === "/") {
    result = basePath;
  } else if (fromPath.toLowerCase().indexOf(basePath.toLowerCase()) !== 0) {
    result = basePath + fromPath;
  } else {
    result = fromPath;
  }
  return result + normalize(path) || "/";
}

export function joinPaths(from: string, to: string): string {
  return normalize(from).replace(/\/*(\*.*)?$/g, "") + normalize(to);
}

export function matchPath(path: string, location: string, partial?: boolean): PathMatch | null {
  const [pattern, splat] = path.split("/*", 2);
  const segments = pattern.split("/").filter(Boolean);
  const len = segments.length;
  const { pathname } = new URL(location, "http://localhost");
  const locSegments = pathname.split("/").filter(Boolean);
  const lenDiff = locSegments.length - len;
  if (lenDiff < 0 || (lenDiff > 0 && splat === undefined && !partial)) {
    return null;
  }

  const match: PathMatch = {
    path: len ? "" : "/",
    params: {}
  };

  for (let i = 0; i < len; i++) {
    const segment = segments[i];
    const locSegment = locSegments[i];

    if (segment[0] === ":") {
      match.params[segment.slice(1)] = locSegment;
    } else if (segment.localeCompare(locSegment, undefined, { sensitivity: "base" }) !== 0) {
      return null;
    }
    match.path += `/${locSegment}`;
  }

  if (splat) {
    match.params[splat] = lenDiff ? locSegments.slice(-lenDiff).join("/") : "";
  }

  return match;
}

export function scoreRoute(route: MatchedRoute): number {
  const [pattern, splat] = route.pattern.split("/*", 2);
  const segments = pattern.split("/").filter(Boolean);
  return segments.reduce(
    (score, segment) => score + (segment.startsWith(":") ? 2 : 3),
    segments.length - (splat === undefined ? 0 : 1)
  );
}

export function createMatchedRoute(
  routeDef: RouteDefinition,
  base: string,
  id: string,
  location: string
): MatchedRoute | null {
  if (!routeDef || typeof routeDef !== "object" || !routeDef.hasOwnProperty("path")) {
    return null;
  }

  const { path: originalPath, component = Outlet, children, data } = routeDef;
  const isLeaf = !children || !Array.isArray(children) || !children.length;
  const path = joinPaths(base, originalPath);
  const pattern = isLeaf ? path : path.split("/*", 1)[0];

  const match = matchPath(pattern, location, !isLeaf);
  if (!match) {
    return null;
  }

  return {
    id,
    originalPath,
    pattern,
    component,
    children,
    data,
    match,
    shared: false
  };
}

export function getMatchedBranch(
  routeDef: RouteDefinition | RouteDefinition[],
  location: string,
  stack: MatchedRoute[] = [],
  branches: Branch[] = []
): Branch | null {
  const routeDefs = Array.isArray(routeDef) ? routeDef : [routeDef];

  for (let i = 0, len = routeDefs.length; i < len; i++) {
    const def = routeDefs[i];
    const parent = stack[stack.length - 1];
    const route = createMatchedRoute(
      def,
      parent ? parent.pattern : "/",
      parent ? `${parent.id}.${i}` : "" + i,
      location
    );

    if (route) {
      stack.push(route);

      if (def.children) {
        getMatchedBranch(def.children, location, stack, branches);
      } else {
        const score = scoreRoute(route);
        if (!branches.length || score > branches[0].score) {
          branches[0] = {
            routes: [...stack],
            score
          };
        }
      }

      stack.pop();
    }
  }

  return branches[0] || null;
}

export interface RouterContextState {
  routes: MatchedRoute[];
  location: string;
}

export const RouterContext = /*#__PURE__*/ createContext<RouterContextState>();

export const useRouter = () => useContext(RouterContext)!;

export interface OutletContextState {
  depth: number;
  route: MatchedRoute;
}

export const OutletContext = /*#__PURE__*/ createContext<OutletContextState>();

export const useOutlet = () => useContext(OutletContext);

export const useRouteParams = () => {
  const outlet = useOutlet()!;
  return () => outlet.route.match.params;
};

export interface RouterProps {
  location: string;
  prevLocation: string | null;
  routes: RouteDefinition | RouteDefinition[];
  children: JSX.Element;
  out?: any;
}

export function Router(props: RouterProps) {
  const context = useRequest();
  const next = getMatchedBranch(props.routes, props.location);
  if (!next || !next.routes.length) {
    return [];
  }

  const nextRoutes = next.routes;

  const prev =
    !context.mutation && props.prevLocation
      ? getMatchedBranch(props.routes, props.prevLocation)
      : null;
  if (prev) {
    const prevRoutes = prev.routes;

    if (import.meta.env.PROD) {
      let nextAssets = getAssetsFromManifest(context, [
        nextRoutes.map(r => ({
          ...r,
          ...r.match
        }))
      ]);

      let prevAssets = getAssetsFromManifest(context, [
        prevRoutes.map(r => ({
          ...r,
          ...r.match
        }))
      ]);

      const set = new Set();
      prevAssets.forEach(a => {
        set.add(a.href);
      });

      let assetsToAdd: [string, string][] = [];

      let assetsToRemove: Record<string, [string, string]> = {};

      nextAssets.forEach(a => {
        if (!set.has(a.href) && (a.type === "script" || a.type === "style")) {
          assetsToRemove[a.href] = [a.type, a.href];
        } else {
          set.delete(a.href);
        }
      });

      [...set.entries()].forEach(a => {
        let prev = prevAssets.find(p => p.href === a[1]);
        if (prev) {
          assetsToAdd.push([prev.type, prev.href]);
        }
      });

      props.out.assets = [Object.values(assetsToRemove), assetsToAdd];
    }

    for (let i = 0, len = nextRoutes.length; i < len; i++) {
      const nextRoute = nextRoutes[i];
      const prevRoute = prevRoutes[i];
      if (
        prevRoute &&
        nextRoute.id === prevRoute.id &&
        nextRoute.match.path === prevRoute.match.path
      ) {
        if (JSON.stringify(nextRoute.match.params) === JSON.stringify(prevRoute.match.params)) {
          props.out.replaceOutletId = `outlet-${prevRoute.id}`;
          props.out.newOutletId = `outlet-${nextRoute.id}`;
        } else {
          props.out.replaceOutletId = `outlet-${prevRoute.id}`;
          props.out.newOutletId = `outlet-${nextRoute.id}`;
          props.out.prevRoute = prevRoute;
          props.out.nextRoute = nextRoute;
        }
        // Routes are shared
      } else if (prevRoute && nextRoute) {
        props.out.replaceOutletId = `outlet-${prevRoute.id}`;
        props.out.prevRoute = prevRoute;
        props.out.newOutletId = `outlet-${nextRoute.id}`;
        props.out.nextRoute = nextRoute;
      }
    }
  }

  const state = {
    routes: nextRoutes,
    location: props.location,
    out: props.out
  };

  // if (props.out.prevRoute) {
  //   props.out.partial = true;
  //   return (
  //     <RouterContext.Provider value={state}>
  //       <OutletContext.Provider
  //         value={{ depth: nextRoutes.indexOf(props.out.nextRoute) + 1, route: props.out.nextRoute }}
  //       >
  //         <NoHydration>
  //           <Suspense>
  //             <Routes>
  //               <Route
  //                 path={props.out.nextRoute.pattern}
  //                 component={props.out.nextRoute.component}
  //                 data={props.out.nextRoute.data}
  //                 children={props.out.nextRoute.children}
  //               />
  //             </Routes>
  //           </Suspense>
  //         </NoHydration>
  //       </OutletContext.Provider>
  //     </RouterContext.Provider>
  //   );
  // }

  return <RouterContext.Provider value={state}>{props.children}</RouterContext.Provider>;
}

export function Outlet(props: { children: JSX.Element }) {
  const router = useRouter();
  const parent = useOutlet();
  const depth = parent ? parent.depth : 0;

  const state = {
    depth: depth + 1,
    route: router.routes[depth]
  };

  return (
    <>
      {ssr(`<!--outlet-${state.route.id}--><outlet-wrapper id="outlet-${state.route.id}">`)}
      <OutletContext.Provider value={state}>{props.children}</OutletContext.Provider>
      {ssr(`</outlet-wrapper><!--outlet-${state.route.id}-->`)}
    </>
  );
}
