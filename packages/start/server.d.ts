declare const server: (<T>(fn: T) => T) & {
  getHandler: (hash: string) => any;
  registerHandler: (hash: string, handler: any) => any;
  setClientMiddleware(...middleware: Middleware[]): void;
  setRequest(ctx: RequestContext): void;
  getRequest(): RequestContext;
};

export default server;

export interface RequestContext {
  request: Request;
  headers: Response["headers"];
  context?: Record<string, any>;
}
/** Function responsible for listening for streamed [operations]{@link Operation}. */
export type Middleware = (input: MiddlewareInput) => MiddlewareFn;

/** Input parameters for to an Exchange factory function. */
export interface MiddlewareInput {
  ctx: any;
  next: MiddlewareFn;
  // dispatchDebug: <T extends keyof DebugEventTypes | string>(t: DebugEventArg<T>) => void;
}

/** Function responsible for receiving an observable [operation]{@link Operation} and returning a [result]{@link OperationResult}. */
export type MiddlewareFn = (request: RequestContext) => Promise<Response>;
