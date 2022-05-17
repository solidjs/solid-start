export * from "solid-app-router";

import { useLocation, useNavigate, useParams } from "solid-app-router";
import { useContext } from "solid-js";
import { isRedirectResponse, LocationHeader } from "../server/responses";
import { StartContext } from "../server/StartContext";
import { createResource, ResourceReturn, createRenderEffect } from "solid-js";
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

  const location = useLocation();
  const params = useParams();

  if (typeof source === "function") {
    let oldSource: any = source;
    source = () => oldSource({ location, params });
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

  return resource;
}
