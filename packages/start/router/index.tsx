export * from "solid-app-router";
import { useLocation, useParams } from "solid-app-router";
import { createResource, ResourceFetcher, ResourceReturn, sharedConfig } from "solid-js";
import type { ResourceOptions, ResourceSource } from "solid-js/types/reactive/signal";

type RouteResourceSource<S> =
  | S
  | false
  | null
  | undefined
  | ((params: {
      location: ReturnType<typeof useLocation>;
      params: ReturnType<typeof useParams>;
    }) => S | false | null | undefined);

export function createRouteResource<T, S = true>(
  fetcher: ResourceFetcher<S, T>,
  options?: ResourceOptions<undefined>
): ResourceReturn<T | undefined>;
export function createRouteResource<T, S = true>(
  fetcher: ResourceFetcher<S, T>,
  options: ResourceOptions<T>
): ResourceReturn<T>;
export function createRouteResource<T, S>(
  source: RouteResourceSource<S>,
  fetcher: ResourceFetcher<S, T>,
  options?: ResourceOptions<undefined>
): ResourceReturn<T | undefined>;
export function createRouteResource<T, S>(
  source: RouteResourceSource<S>,
  fetcher: ResourceFetcher<S, T>,
  options: ResourceOptions<T>
): ResourceReturn<T>;
export function createRouteResource<T, S>(
  source: RouteResourceSource<S> | ResourceFetcher<S, T>,
  fetcher?: ResourceFetcher<S, T> | ResourceOptions<T> | ResourceOptions<undefined>,
  options?: ResourceOptions<T> | ResourceOptions<undefined>
): ResourceReturn<T> | ResourceReturn<T | undefined> {
  if (arguments.length === 2) {
    if (typeof fetcher === "object") {
      options = fetcher as ResourceOptions<T> | ResourceOptions<undefined>;
      fetcher = source as ResourceFetcher<S, T>;
      source = true as ResourceSource<S>;
    }
  } else if (arguments.length === 1) {
    fetcher = source as ResourceFetcher<S, T>;
    source = true as ResourceSource<S>;
  }

  const location = useLocation();
  const params = useParams();

  if (typeof source === "function") {
    let oldSource: any = source;
    source = () => oldSource({ location, params });
  }
  // @ts-ignore
  return createResource(source, fetcher, options);
}




