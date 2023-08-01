import type {
  Accessor, Resource,
  ResourceFetcher, ResourceFetcherInfo, ResourceOptions, Setter
} from "solid-js";
import {
  createResource,
  onCleanup,
  startTransition, untrack
} from "solid-js";
import type { ReconcileOptions } from "solid-js/store";
import { createStore, reconcile, unwrap } from "solid-js/store";
import { isServer } from "solid-js/web";
import { useNavigate } from "../router";
import { isRedirectResponse, LocationHeader } from "../server/responses";
import { useRequest } from "../server/ServerContext";
import { FETCH_EVENT, ServerFunctionEvent } from "../server/types";

interface RouteDataEvent extends ServerFunctionEvent {}

type RouteDataSource<S> = S | false | null | undefined | (() => S | false | null | undefined);

type RouteDataFetcher<S, T> = (source: S, event: RouteDataEvent) => T | Promise<T>;

type RouteDataOptions<T, S> = ResourceOptions<T> & {
  key?: RouteDataSource<S>;
  reconcileOptions?: ReconcileOptions;
};

const resources = new Set<(k: any) => void>();
const promises = new Map<any, Promise<any>>();

export function createRouteData<T, S = true>(
  fetcher: RouteDataFetcher<S, T>,
  options?: RouteDataOptions<undefined, S>
): Resource<T | undefined>;
export function createRouteData<T, S = true>(
  fetcher: RouteDataFetcher<S, T>,
  options: RouteDataOptions<T, S>
): Resource<T>;
export function createRouteData<T, S = true>(
  fetcher: RouteDataFetcher<S, T>,
  options: RouteDataOptions<T, S> | RouteDataOptions<undefined, S> = {}
): Resource<T> | Resource<T | undefined> {
  const navigate = useNavigate();
  const pageEvent = useRequest();

  function handleResponse(response: Response) {
    if (isRedirectResponse(response)) {
      startTransition(() => {
        let url = response.headers.get(LocationHeader);
        if (url && url.startsWith("/")) {
          navigate(url, {
            replace: true
          });
        } else {
          if (!isServer && url) {
            window.location.href = url;
          }
        }
      });
      if (isServer && pageEvent) {
        pageEvent.setStatusCode(response.status);
        response.headers.forEach((head, value) => {
          pageEvent.responseHeaders.set(value, head);
        });
      }
    }
  }

  const resourceFetcher: ResourceFetcher<S, T> = async (key: S) => {
    try {
      let event = pageEvent as RouteDataEvent;
      if (isServer && pageEvent) {
        event = Object.freeze({
          request: pageEvent.request,
          env: pageEvent.env,
          clientAddress: pageEvent.clientAddress,
          locals: pageEvent.locals,
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
    } catch (e: any | Error) {
      if (e instanceof Response) {
        if (isServer) {
          handleResponse(e);
        } else {
          setTimeout(() => handleResponse(e as Response), 0);
        }
        return e;
      }
      throw e;
    }
  };

  function dedupe(fetcher: ResourceFetcher<S, T>): ResourceFetcher<S, T> {
    return (key: S, info: ResourceFetcherInfo<T>) => {
      if (info.refetching && info.refetching !== true && !partialMatch(key, info.refetching) && info.value) {
        return info.value;
      }

      if ((key as unknown as boolean) === true) return fetcher(key, info);

      let promise = promises.get(key);
      if (promise) return promise;
      promise = fetcher(key, info) as Promise<T>;
      promises.set(key, promise);
      return promise.finally(() => promises.delete(key));
    };
  }

  const [resource, { refetch }] = createResource<T, S>(
    (options.key || true) as RouteDataSource<S>,
    dedupe(resourceFetcher),
    {
      storage: (init: T | undefined) => createDeepSignal(init, options.reconcileOptions),
      ...options
    } as any
  );

  if (!isServer) {
    resources.add(refetch);
    onCleanup(() => resources.delete(refetch));
  }

  return resource;
}

export function refetchRouteData(key?: string | any[] | void) {
  if (isServer) throw new Error("Cannot refetch route data on the server.");
  return startTransition(() => {
    for (let refetch of resources) refetch(key);
  });
}

function createDeepSignal<T>(value: T | undefined, options?: ReconcileOptions) {
  const [store, setStore] = createStore({
    value
  });
  return [
    () => store.value,
    (v: T) => {
      const unwrapped = untrack(() => unwrap(store.value));
      typeof v === "function" && (v = v(unwrapped));
      setStore("value", reconcile(v, options));
      return store.value;
    }
  ] as [Accessor<T | null>, Setter<T | null>];
}

/* React Query key matching  https://github.com/tannerlinsley/react-query */
function partialMatch(a: any, b: any) {
  return partialDeepEqual(ensureQueryKeyArray(a), ensureQueryKeyArray(b));
}

function ensureQueryKeyArray<V extends any | any[], R = V extends [] ? V : [V]>(value: V): R {
  return (Array.isArray(value) ? value : [value]) as R;
}

/**
 * Checks if `b` partially matches with `a`.
 */
function partialDeepEqual(a: any, b: any): boolean {
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
