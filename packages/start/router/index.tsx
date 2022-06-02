export * from "solid-app-router";

import { useLocation, useNavigate, useParams } from "solid-app-router";
import { useContext, startTransition, onCleanup} from "solid-js";
import { isRedirectResponse, LocationHeader } from "../server/responses";
import { StartContext } from "../server/StartContext";
import { createResource, ResourceReturn } from "solid-js";
import { ResourceOptions, ResourceSource } from "solid-js/types/reactive/signal";
import { isServer } from "solid-js/web";
import { PageContext, RequestContext } from "../server/types";

type RouteResourceContext = Omit<PageContext, "tags" | "manifest" | "routerContext">;

type RouteResourceSource<S> =
  | S
  | false
  | null
  | undefined
  | ((params: {
      location: ReturnType<typeof useLocation>;
      params: ReturnType<typeof useParams>;
      context: RequestContext;
    }) => S | false | null | undefined);

type RouteResourceFetcher<S, T> = (context: RouteResourceContext, k: S) => T | Promise<T>;

const resources = new Set<(k: any) => void>();

export function createRouteResource<T, S = true>(
  fetcher: RouteResourceFetcher<S, T>,
  options?: ResourceOptions<undefined>
): ResourceReturn<T | undefined>;
export function createRouteResource<T, S = true>(
  fetcher: RouteResourceFetcher<S, T>,
  options: ResourceOptions<T>
): ResourceReturn<T>;
export function createRouteResource<T, S>(
  source: RouteResourceSource<S>,
  fetcher: RouteResourceFetcher<S, T>,
  options?: ResourceOptions<undefined>
): ResourceReturn<T | undefined>;
export function createRouteResource<T, S>(
  source: RouteResourceSource<S>,
  fetcher: RouteResourceFetcher<S, T>,
  options: ResourceOptions<T>
): ResourceReturn<T>;
export function createRouteResource<T, S>(
  source: RouteResourceSource<S> | RouteResourceFetcher<S, T>,
  fetcher?: RouteResourceFetcher<S, T> | ResourceOptions<T> | ResourceOptions<undefined>,
  options?: ResourceOptions<T> | ResourceOptions<undefined>
): ResourceReturn<T> | ResourceReturn<T | undefined> {
  if (arguments.length === 2) {
    if (typeof fetcher === "object") {
      options = fetcher as ResourceOptions<T> | ResourceOptions<undefined>;
      fetcher = source as RouteResourceFetcher<S, T>;
      source = true as ResourceSource<S>;
    }
  } else if (arguments.length === 1) {
    fetcher = source as RouteResourceFetcher<S, T>;
    source = true as ResourceSource<S>;
  }

  const navigate = useNavigate();
  const context = useContext(StartContext);

  function handleResponse(response: Response) {
    if (isRedirectResponse(response)) {
      navigate(response.headers.get(LocationHeader), {
        replace: true
      });
      if (isServer) {
        context.setStatusCode(response.status);
        response.headers.forEach((head, value) => {
          context.setHeader(value, head);
        });
      }
    }
  }

  let fetcherWithRedirect = async (...args) => {
    try {
      const [key, info] = args;

      if (
        info.refetching &&
        info.refetching !== true &&
        !partialMatch(key, info.refetching)
      ) {
        return info.value;
      }
      let response = await (fetcher as any)(context, ...args);
      if (response instanceof Response) {
        setTimeout(() => handleResponse(response), 0);
        return response;
      }
      return response;
    } catch (e) {
      if (e instanceof Response) {
        setTimeout(() => handleResponse(e), 0);
        return e;
      }
      throw e;
    }
  };

  // @ts-ignore
  let resource = createResource(source, fetcherWithRedirect, options);
  resources.add(resource[1].refetch);
  onCleanup(() => resources.delete(resource[1].refetch));

  return resource;
}

export function refetchRouteResources(key?: any[]) {
  for (let refetch of resources) refetch(key);
}

/* React Query key matching  https://github.com/tannerlinsley/react-query */
function partialMatch(a, b) {
  return partialDeepEqual(ensureQueryKeyArray(a), ensureQueryKeyArray(b));
}

function ensureQueryKeyArray(value) {
  return Array.isArray(value) ? value : [value];
}

/**
 * Checks if `b` partially matches with `a`.
 */
function partialDeepEqual(a, b) {
  if (a === b) {
    return true;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  if (a && b && typeof a === "object" && typeof b === "object") {
    return !Object.keys(b).some((key) => !partialDeepEqual(a[key], b[key]));
  }

  return false;
}