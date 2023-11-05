export { composeMiddleware, createHandler, default as StartServer } from "./StartServer";
export type { Middleware, MiddlewareFn, MiddlewareInput } from "./StartServer";

import { JSX } from "solid-js";
import { apiRoutes } from "../api/middleware";
import { inlineServerFunctions } from "../server/middleware";
import {
  renderAsync as _renderAsync,
  renderStream as _renderStream,
  renderSync as _renderSync
} from "../server/render";
import { PageEvent } from "../server/types";
import { composeMiddleware } from "./StartServer";

export const render = (
  fn: (context: PageEvent) => JSX.Element,
  options?: {
    timeoutMs?: number;
    nonce?: string;
    renderId?: string;
  }
) =>
  composeMiddleware([
    apiRoutes,
    inlineServerFunctions,
    import.meta.env.START_SSR === "async"
      ? _renderAsync(fn, options)
      : import.meta.env.START_SSR === "streaming"
      ? _renderStream(fn, options)
      : _renderSync(fn, options)
  ]);

export const renderAsync = (
  fn: (context: PageEvent) => JSX.Element,
  options?: {
    timeoutMs?: number;
    nonce?: string;
    renderId?: string;
  }
) => composeMiddleware([apiRoutes, inlineServerFunctions, _renderAsync(fn, options)]);

export const renderStream = (
  fn: (context: PageEvent) => JSX.Element,
  options?: {
    timeoutMs?: number;
    nonce?: string;
    renderId?: string;
  }
) => composeMiddleware([apiRoutes, inlineServerFunctions, _renderStream(fn, options)]);

export const renderSync = (
  fn: (context: PageEvent) => JSX.Element,
  options?: {
    timeoutMs?: number;
    nonce?: string;
    renderId?: string;
  }
) => composeMiddleware([apiRoutes, inlineServerFunctions, _renderSync(fn, options)]);
