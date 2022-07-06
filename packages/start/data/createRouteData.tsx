import { useNavigate } from "solid-app-router";
import { createResource, onCleanup, Resource, useContext } from "solid-js";
import type { ResourceOptions, ResourceSource } from "solid-js/types/reactive/signal";
import { isServer } from "solid-js/web";
import { isRedirectResponse, LocationHeader } from "../server/responses";
import { ServerContext } from "../server/ServerContext";
import { FETCH_EVENT, ServerFunctionEvent } from "../server/types";

interface RouteDataEvent extends ServerFunctionEvent {}

type RouteResourceSource<S> = S | false | null | undefined | (() => S | false | null | undefined);

type RouteResourceFetcher<S, T> = (source: S, event: RouteDataEvent) => T | Promise<T>;

const resources = new Set<(k: any) => void>();

export function createRouteData<T, S = true>(
  fetcher: RouteResourceFetcher<S, T>,
  options?: ResourceOptions<undefined>
): Resource<T | undefined>;
export function createRouteData<T, S = true>(
  fetcher: RouteResourceFetcher<S, T>,
  options: ResourceOptions<T>
): Resource<T>;
export function createRouteData<T, S>(
  source: RouteResourceSource<S>,
  fetcher: RouteResourceFetcher<S, T>,
  options?: ResourceOptions<undefined>
): Resource<T | undefined>;
export function createRouteData<T, S>(
  source: RouteResourceSource<S>,
  fetcher: RouteResourceFetcher<S, T>,
  options: ResourceOptions<T>
): Resource<T>;
export function createRouteData<T, S>(
  source: RouteResourceSource<S> | RouteResourceFetcher<S, T>,
  fetcher?: RouteResourceFetcher<S, T> | ResourceOptions<T> | ResourceOptions<undefined>,
  options?: ResourceOptions<T> | ResourceOptions<undefined>
): Resource<T> | Resource<T | undefined> {
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
  const pageEvent = useContext(ServerContext);

  function handleResponse(response: Response) {
    if (isRedirectResponse(response)) {
      let url = response.headers.get(LocationHeader);
      if (url.startsWith("/")) {
        navigate(response.headers.get(LocationHeader), {
          replace: true
        });
      } else {
        if (!isServer) {
          window.location.href = response.headers.get(LocationHeader);
        }
      }
      if (isServer) {
        pageEvent.setStatusCode(response.status);
        response.headers.forEach((head, value) => {
          pageEvent.responseHeaders.set(value, head);
        });
      }
    }
  }

  let fetcherWithRedirect = async (key, info) => {
    try {
      if (info.refetching && info.refetching !== true && !partialMatch(key, info.refetching)) {
        return info.value;
      }

      let event = pageEvent as RouteDataEvent;
      if (isServer) {
        event = Object.freeze({
          request: pageEvent.request,
          env: pageEvent.env,
          $type: FETCH_EVENT,
          fetch: pageEvent.fetch
        });
      }

      let response = await (fetcher as any).call(event, key, event);
      if (response instanceof Response) {
        if (isServer) {
          handleResponse(response);
        } else {
          setTimeout(() => handleResponse(response), 0);
        }
      }
      return response;
    } catch (e) {
      if (e instanceof Response) {
        if (isServer) {
          handleResponse(e);
        } else {
          setTimeout(() => handleResponse(e), 0);
        }
        return e;
      }
      throw e;
    }
  };

  // @ts-ignore
  const [resource, { refetch }] = createResource(source, fetcherWithRedirect, options);
  resources.add(refetch);
  onCleanup(() => resources.delete(refetch));

  return resource;
}

export function refetchRouteData(key?: string | any[] | void) {
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

  if (a.length && !b.length) return false;

  if (a && b && typeof a === "object" && typeof b === "object") {
    return !Object.keys(b).some(key => !partialDeepEqual(a[key], b[key]));
  }

  return false;
}
