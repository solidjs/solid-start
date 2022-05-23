import { RequestContext } from "../server/types";

// the line below will be replaced by the compiler with a configuration of routes
// based on the files in src/routes
// we have to keep this var so that we can find it even if vite precompiles the code
// @ts-ignore
var api = $API_ROUTES;

type Method = "get" | "post" | "put" | "delete" | "patch";
type Handler = (ctx: RequestContext, params: Record<string, string>) => Response;

type RouteData = {
  [method in Method]?: Handler;
} & {
  path: string;
};

type ParameterType = "parametric" | "wildcard";
type Route = RouteData & {
  params?: [ParameterType, string, number][];
};

type RouteTree = {
  static?: { [key: string]: RouteTree };
  parametric?: RouteTree;
  wildcard?: RouteTree;
  route?: Route;
};

function createRouteTree(routes: RouteData[]) {
  return routes.reduce<RouteTree>((tree, routeData) => {
    const sections = routeData.path
      .slice(1, routeData.path.endsWith("/") ? -1 : routeData.path.length)
      .split("/");

    let params: [ParameterType, string, number][] = [];

    let current = tree;
    for (const [i, section] of sections.entries()) {
      if (section[0] === ":") {
        current = current.parametric ?? (current.parametric = {});
        params.push(["parametric", section.slice(1), i]);
      } else if (section[0] === "*") {
        current = current.wildcard ?? (current.wildcard = {});
        params.push(["wildcard", section.slice(1), i]);
      } else {
        if (!current.static) {
          current.static = Object.create(null);
        }
        current = current.static![section] ?? (current.static![section] = {});
      }
    }

    current.route = routeData;
    current.route.params = params;

    return tree;
  }, {});
}

function matchRoute(
  tree: RouteTree,
  url: string,
  method: Method
): { handler: Handler; params: Record<string, string> } | undefined {
  const sections = url.slice(1, url.endsWith("/") ? -1 : url.length).split("/");
  const route = _matchRoute(tree, sections, 0);

  if (route?.[method]) {
    const params =
      route.params?.reduce<Record<string, string>>((params, [type, name, sectionIndex]) => {
        if (type === "wildcard") {
          params[name] = sections.slice(sectionIndex).join("/");
        } else {
          params[name] = sections[sectionIndex];
        }
        return params;
      }, {}) ?? {};

    return { handler: route[method]!, params };
  }
}

function _matchRoute(tree: RouteTree, sections: string[], start: number): Route | undefined {
  if (start === sections.length) {
    if (tree.route) {
      return tree.route;
    } else if (tree.wildcard) {
      return tree.wildcard.route;
    }
    return;
  }

  const section = sections[start];

  if (tree.static?.[section]) {
    const result = _matchRoute(tree.static[section], sections, start + 1);
    if (result) {
      return result;
    }
  }

  if (tree.parametric) {
    const result = _matchRoute(tree.parametric, sections, start + 1);
    if (result) {
      return result;
    }
  }

  if (tree.wildcard) {
    const result = _matchRoute(tree.wildcard, sections, sections.length);
    if (result) {
      return result;
    }
  }
}

const routeTree = createRouteTree(api);

export function getApiHandler(url: URL, method: string) {
  return matchRoute(routeTree, url.pathname, method.toLowerCase() as Method);
}
