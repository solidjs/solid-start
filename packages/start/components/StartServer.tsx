import { ssr } from "solid-js/web";
import { MetaProvider } from "solid-meta";
import { RouteDataFunc, Router } from "solid-app-router";
// @ts-expect-error
import Root from "~/root";
import { StartProvider } from "./StartContext";

const rootData = Object.values(import.meta.globEager("/src/root.data.(js|ts)"))[0];
const dataFn: RouteDataFunc = rootData ? rootData.default : undefined;

export interface RequestContext {
  request: Request;
  headers: Response["headers"];
  manifest: Record<string, any>;
  context?: Record<string, any>;
}
/** Function responsible for listening for streamed [operations]{@link Operation}. */
export type Middleware = (input: MiddlewareInput) => MiddlewareFn;

/** Input parameters for to an Exchange factory function. */
export interface MiddlewareInput {
  ctx: any;
  forward: MiddlewareFn;
  // dispatchDebug: <T extends keyof DebugEventTypes | string>(t: DebugEventArg<T>) => void;
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
  const exchange = composeMiddleware(exchanges);
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
export default ({
  url,
  manifest,
  context = {}
}: {
  url: string;
  manifest: Record<string, any>;
  context?: Partial<RequestContext> & { tags?: [] };
}) => {
  // context.headers = {};
  context.tags = [];
  const parsed = new URL(url);
  const path = parsed.pathname + parsed.search;

  return (
    <StartProvider context={context} manifest={manifest} request={context.request}>
      <MetaProvider tags={context.tags}>
        <Router url={path} out={context} data={dataFn}>
          {docType as unknown as any}
          <Root />
        </Router>
      </MetaProvider>
    </StartProvider>
  );
};
