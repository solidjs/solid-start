import { ssr } from "solid-js/web";
import { MetaProvider } from "solid-meta";
import { RouteDataFunc, Router } from "solid-app-router";
import Root from "~/root";
import { sharedConfig } from "solid-js";
import { StartProvider } from "../server/StartContext";
import { inlineServerFunctions } from "../server/middleware";
import { PageContext, RequestContext } from "../server/types";
import { apiRoutes } from "../api/middleware";

const rootData = Object.values(import.meta.globEager("/src/root.data.(js|ts)"))[0];
const dataFn: RouteDataFunc = rootData ? rootData.default : undefined;

/** Function responsible for listening for streamed [operations]{@link Operation}. */
export type Middleware = (input: MiddlewareInput) => MiddlewareFn;

/** Input parameters for to an Exchange factory function. */
export interface MiddlewareInput {
  ctx: { request: RequestContext };
  forward: MiddlewareFn;
  // dispatchDebug: <T extends keyof DebugEventTypes | string>(t: DebugEventArg<T>) => void;
}

declare module "solid-js" {
  export type HydrationContext = {
    requestContext: RequestContext;
  };
}

/** Function responsible for receiving an observable [operation]{@link Operation} and returning a [result]{@link OperationResult}. */
export type MiddlewareFn = (request: RequestContext) => Promise<Response>;

/** This composes an array of Exchanges into a single ExchangeIO function */
export const composeMiddleware =
  (exchanges: Middleware[]) =>
  ({ ctx, forward }: MiddlewareInput) =>
    exchanges.reduceRight(
      (forward, exchange) =>
        exchange({
          ctx: ctx,
          forward
        }),
      forward
    );

export function createHandler(...exchanges: Middleware[]) {
  const exchange = composeMiddleware([apiRoutes, inlineServerFunctions, ...exchanges]);
  return async (request: RequestContext) => {
    return await exchange({
      ctx: {
        request
      },
      // fallbackExchange
      forward: async op => {
        return new Response(null, {
          status: 404
        });
      }
    })(request);
  };
}

const docType = ssr("<!DOCTYPE html>");
export default ({ context }: { context: PageContext }) => {
  let pageContext = context;
  pageContext.routerContext = {};
  pageContext.tags = [];

  pageContext.setStatusCode = (code: number) => {
    pageContext.responseHeaders.set("x-solidstart-status-code", code.toString());
  };

  pageContext.setHeader = (name: string, value: string) => {
    pageContext.responseHeaders.set(name, value.toString());
  };

  // @ts-expect-error
  sharedConfig.context.requestContext = context;
  const parsed = new URL(context.request.url);
  const path = parsed.pathname + parsed.search;

  return (
    <StartProvider context={pageContext}>
      <MetaProvider tags={pageContext.tags}>
        <Router url={path} out={pageContext.routerContext} data={dataFn}>
          {docType as unknown as any}
          <Root />
        </Router>
      </MetaProvider>
    </StartProvider>
  );
};
