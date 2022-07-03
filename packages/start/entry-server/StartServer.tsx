import { ssr } from "solid-js/web";
import { MetaProvider } from "solid-meta";
import { RouteDataFunc, Router } from "solid-app-router";
import Root from "~/root";
import { ServerContext } from "../server/ServerContext";
import { inlineServerFunctions } from "../server/middleware";
import { PageFetchEvent, FetchEvent } from "../server/types";
import { apiRoutes } from "../api/middleware";

const rootData = Object.values(import.meta.globEager("/src/root.data.(js|ts)"))[0];
const dataFn: RouteDataFunc = rootData ? rootData.default : undefined;

/** Function responsible for listening for streamed [operations]{@link Operation}. */
export type Middleware = (input: MiddlewareInput) => MiddlewareFn;

/** Input parameters for to an Exchange factory function. */
export interface MiddlewareInput {
  forward: MiddlewareFn;
}

/** Function responsible for receiving an observable [operation]{@link Operation} and returning a [result]{@link OperationResult}. */
export type MiddlewareFn = (event: FetchEvent) => Promise<Response>;

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
  const exchange = composeMiddleware([apiRoutes, inlineServerFunctions, ...exchanges]);
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

const docType = ssr("<!DOCTYPE html>");
export default ({ event }: { event: PageFetchEvent }) => {
  const parsed = new URL(event.request.url);
  const path = parsed.pathname + parsed.search;

  return (
    <ServerContext.Provider value={event}>
      <MetaProvider tags={event.tags}>
        <Router url={path} out={event.routerContext} data={dataFn}>
          {docType as unknown as any}
          <Root />
        </Router>
      </MetaProvider>
    </ServerContext.Provider>
  );
};
