import { isServer } from "solid-js/web";
export default function server(fn) {
  throw new Error("Should be compiled away");
}

if (!isServer) {
  server.middleware = [fetchServerModule()];
  server.setClientMiddleware = (...middleware) => {
    server.middleware = [...middleware, fetchServerModule()];
  };

  const composeMiddleware =
    exchanges =>
    ({ ctx, next }) =>
      exchanges.reduceRight(
        (next, exchange) =>
          exchange({
            ctx: ctx,
            next
          }),
        next
      );

  function createHandler(...middleware) {
    const handler = composeMiddleware(middleware);
    return async request => {
      return await handler({
        ctx: {
          request
        },
        // fallbackExchange
        next: async op => {
          return new Response(null, {
            status: 404
          });
        }
      })(request);
    };
  }

  function fetchServerModule() {
    return ({ ctx, next }) => {
      return async op => {
        let response = await fetch(`/_m${op.key}`, {
          method: op.method ?? "POST",
          body: JSON.stringify([op.key, op.args]),
          headers: {
            "Content-Type": "application/json",
            ...op.headers,
            ...ctx.headers
          }
        });
        return await response.json();
      };
    };
  }

  server.fetch = (hash, middleware = []) => {
    return async (...args) => {
      const handler = createHandler(...middleware, ...server.middleware);
      return await handler({
        key: hash,
        args
      });
    };
  };
}

if (isServer) {
  const handlers = new Map();
  server.ctx = null;
  server.handler = fn => {
    return fn;
  };

  server.setRequest = ctx => {
    server.ctx = ctx;
  };

  server.getRequest = () => {
    return server.ctx;
  };

  server.registerHandler = function (hash, handler) {
    handlers.set(hash, handler);
  };

  server.getHandler = function (hash) {
    return handlers.get(hash);
  };
}
