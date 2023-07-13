import { MetaProvider } from "@solidjs/meta";
import { RouteDataFunc, Router, RouterProps } from "@solidjs/router";
import { ComponentProps, sharedConfig } from "solid-js";
import { ssr } from "solid-js/web";
// @ts-ignore
import Root from "~start/root";
import { RouteDefinition, Router as IslandsRouter } from "../islands/server-router";

import { fileRoutes } from "../root/FileRoutes";
import { ServerContext } from "../server/ServerContext";
import { FetchEvent, PageEvent } from "../server/types";

const rootData = Object.values(import.meta.glob("/src/root.data.(js|ts)", { eager: true }))[0] as {
  default: RouteDataFunc;
};
const dataFn: RouteDataFunc | undefined = rootData ? rootData.default : undefined;

/** Function responsible for listening for streamed [operations]{@link Operation}. */
export type Middleware = (input: MiddlewareInput) => MiddlewareFn;

/** Input parameters for to an Exchange factory function. */
export interface MiddlewareInput {
  forward: MiddlewareFn;
}

/** Function responsible for receiving an observable [operation]{@link Operation} and returning a [result]{@link OperationResult}. */
export type MiddlewareFn = (event: FetchEvent) => Promise<Response> | Response;

/** This composes an array of Exchanges into a single ExchangeIO function */
export const composeMiddleware =
  (exchanges: Middleware[]) =>
  ({ forward }: MiddlewareInput) =>
    exchanges.reduceRight(
      (forward, exchange) =>
        exchange({
          forward
        }),
      forward
    );

export function createHandler(...exchanges: Middleware[]) {
  const exchange = composeMiddleware(exchanges);
  return async (event: FetchEvent) => {
    return await exchange({
      forward: async op => {
        return new Response(null, {
          status: 404
        });
      }
    })(event);
  };
}

export function StartRouter(
  props: RouterProps & {
    location: string;
    prevLocation: string | null;
    routes: RouteDefinition | RouteDefinition[];
  }
) {
  if (import.meta.env.START_ISLANDS_ROUTER) {
    return (
      <Router {...props}>
        <IslandsRouter {...props}>{props.children}</IslandsRouter>
      </Router>
    );
  }
  return <Router {...props}></Router>;
}

// @ts-ignore
const devNoSSR = import.meta.env.DEV && !import.meta.env.START_SSR;

const docType = ssr("<!DOCTYPE html>");
export default function StartServer({ event }: { event: PageEvent }) {
  const parsed = new URL(event.request.url);
  const path = parsed.pathname + parsed.search;

  // @ts-ignore
  sharedConfig.context.requestContext = event;
  return (
    <ServerContext.Provider value={event}>
      {devNoSSR ? (
        <>
          {docType as unknown as any}
          <Root />
        </>
      ) : (
        <MetaProvider tags={event.tags as ComponentProps<typeof MetaProvider>["tags"]}>
          <StartRouter
            url={path}
            out={event.routerContext}
            location={path}
            prevLocation={event.prevUrl}
            data={dataFn}
            routes={fileRoutes}
          >
            {docType as unknown as any}
            <Root />
          </StartRouter>
        </MetaProvider>
      )}
    </ServerContext.Provider>
  );
}
