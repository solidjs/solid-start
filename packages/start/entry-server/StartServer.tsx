import { ssr } from "solid-js/web";
import { MetaProvider } from "solid-meta";
import { RouteDataFunc, Router } from "solid-app-router";
import Root from "~/root";
import { sharedConfig } from "solid-js";
import { StartProvider } from "./StartContext";

const rootData = Object.values(import.meta.globEager("/src/root.data.(js|ts)"))[0];
const dataFn: RouteDataFunc = rootData ? rootData.default : undefined;

export type ManifestEntry = {
  type: string;
  href: string;
};

export type ContextMatches = {
  originalPath: string;
  pattern: string;
  path: string;
  params: unknown;
};

type TagDescription = {
  tag: string;
  props: Record<string, unknown>;
};

type RouterContext = {
  matches?: ContextMatches[][];
  url?: string;
};

export interface RequestContext {
  request: Request;
  responseHeaders: Response["headers"];
  manifest: Record<string, ManifestEntry[]>;
  routerContext?: RouterContext;
  tags?: TagDescription[];
}
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
export default ({ context }: { context: RequestContext }) => {
  context.routerContext = {};
  context.tags = [];

  // @ts-expect-error
  sharedConfig.context.requestContext = context;
  const parsed = new URL(context.request.url);
  const path = parsed.pathname + parsed.search;

  return (
    <StartProvider context={context}>
      <MetaProvider tags={context.tags}>
        <Router url={path} out={context.routerContext} data={dataFn}>
          {docType as unknown as any}
          <Root />
        </Router>
      </MetaProvider>
    </StartProvider>
  );
};
