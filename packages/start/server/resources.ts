import { useLocation, useNavigate, useParams } from "solid-app-router";
import { useContext } from "solid-js";
import { isRedirectResponse, LocationHeader } from "./responses";
import { StartContext } from "./StartContext";
import { createResource, ResourceFetcher, ResourceReturn, createRenderEffect } from "solid-js";
import { ResourceOptions, ResourceSource } from "solid-js/types/reactive/signal";

type RouteResourceSource<S> =
  | S
  | false
  | null
  | undefined
  | ((params: {
      location: ReturnType<typeof useLocation>;
      params: ReturnType<typeof useParams>;
    }) => S | false | null | undefined);

export function createServerResource<T, S = true>(
  fetcher: ResourceFetcher<S, T>,
  options?: ResourceOptions<undefined>
): ResourceReturn<T | undefined>;
export function createServerResource<T, S = true>(
  fetcher: ResourceFetcher<S, T>,
  options: ResourceOptions<T>
): ResourceReturn<T>;
export function createServerResource<T, S>(
  source: RouteResourceSource<S>,
  fetcher: ResourceFetcher<S, T>,
  options?: ResourceOptions<undefined>
): ResourceReturn<T | undefined>;
export function createServerResource<T, S>(
  source: RouteResourceSource<S>,
  fetcher: ResourceFetcher<S, T>,
  options: ResourceOptions<T>
): ResourceReturn<T>;
export function createServerResource<T, S>(
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

  const navigate = useNavigate();
  const context = useContext(StartContext);

  let serverFetcher = async (...args) => {
    try {
      let response = await (fetcher as any)(...args);
      return response;
    } catch (e) {
      if (e instanceof Response) {
        if (isRedirectResponse(e)) {
          return e;
        }
      }
      throw e;
    }
  };

  // @ts-ignore
  let resource = createResource(source, serverFetcher, options);

  createRenderEffect(() => {
    let response = resource[0]();
    if (response instanceof Response && isRedirectResponse(response)) {
      navigate(response.headers.get(LocationHeader), {
        replace: true
      });
      if (context.responseHeaders) {
        let responseHeaders = context.responseHeaders;
        responseHeaders.set("x-solidstart-status-code", response.status.toString());
        response.headers.forEach((head, value) => {
          responseHeaders.set(value, head);
        });
      }
    }
  });

  return resource;
}
