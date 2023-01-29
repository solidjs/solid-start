import { createContext, JSX, useContext } from "solid-js";
import { ssr } from "solid-js/web";
export interface RouteDefinition {
  path: string;
  component?: () => JSX.Element;
  children?: RouteDefinition | RouteDefinition[];
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
  match: PathMatch;
  shared: boolean;
}

export interface Branch {
  routes: MatchedRoute[];
  score: number;
}

const hasSchemeRegex = /^(?:[a-z0-9]+:)?\/\//i;
const trimPathRegex = /^\/+|\/+$|\s+/g;

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
  const locSegments = location.split("/").filter(Boolean);
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

  const { path: originalPath, component = Outlet, children } = routeDef;
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

export const RouterContext = createContext<RouterContextState>();

export const useRouter = () => useContext(RouterContext)!;

export interface OutletContextState {
  depth: number;
  route: MatchedRoute;
}

export const OutletContext = createContext<OutletContextState>();

export const useOutlet = () => useContext(OutletContext);

export const useRouteParams = () => {
  const outlet = useOutlet()!;
  return () => outlet.route.match.params;
};

export interface RouterProps {
  location: string;
  prevLocation: string;
  routes: RouteDefinition | RouteDefinition[];
  children: JSX.Element;
  out?: any;
}

export function Router(props: RouterProps) {
  const next = getMatchedBranch(props.routes, props.location);
  if (!next || !next.routes.length) {
    return [];
  }

  const nextRoutes = next.routes;

  const prev = props.prevLocation ? getMatchedBranch(props.routes, props.prevLocation) : null;
  if (prev) {
    const prevRoutes = prev.routes;

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
          // console.log("diff rendered");
          // const Comp = nextRoute.component;
          props.out.replaceOutletId = `outlet-${prevRoute.id}`;
          props.out.newOutletId = `outlet-${nextRoute.id}`;
          // diffedRender = (
          //   <outlet-wrapper id={`outlet-${nextRoute.id}`}>
          //     <Comp />
          //   </outlet-wrapper>
          // );
          // return diffedRender;
        }
        // Routes are shared
      } else {
        // console.log("diff rendered");
        // const Comp = nextRoute.component;
        props.out.replaceOutletId = `outlet-${prevRoute.id}`;
        props.out.newOutletId = `outlet-${nextRoute.id}`;
        //console.log(prevRoute, nextRoute);
        //console.log(`diff render from: ${props.prevLocation} to: ${props.location}`);
        // diffedRender = (
        //   <outlet-wrapper id={`outlet-${nextRoute.id}`}>
        //     <Comp />
        //   </outlet-wrapper>
        // );
        // return diffedRender;
      }
    }
  }

  const state = {
    routes: nextRoutes,
    location: props.location,
    out: props.out
  };

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
