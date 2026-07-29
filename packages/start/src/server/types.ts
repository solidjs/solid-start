import type { H3, H3Event } from "h3";
import type { JSX } from "@solidjs/web";
import type { RequestEvent } from "@solidjs/web";

/**
 * The h3 app instance returned by `createHandler`.
 *
 * Structurally identical to h3's `H3`, but declared here so that `export default
 * createHandler(...)` in `entry-server.tsx` can be named through `@solidjs/start`.
 * Referring to `H3` directly makes TypeScript emit a reference to h3's internal
 * `H3$1` class, which is not portable when h3 is nested inside
 * `node_modules/@solidjs/start/node_modules` (TS2742 / TS2883).
 */
export interface StartHandler extends H3 {}

export type DocumentComponentProps = {
  assets?: JSX.Element;
  scripts: JSX.Element;
  children?: JSX.Element;
};

export type HandlerOptions = {
  mode?: "sync" | "async" | "stream";
  nonce?: string;
  renderId?: string;
  manifest?: Record<string, any>;
  onCompleteAll?: (options: { write: (v: any) => void }) => void;
  onCompleteShell?: (options: { write: (v: any) => void }) => void;
};

export type ContextMatches = {
  originalPath: string;
  pattern: string;
  path: string;
  params: unknown;
};

export interface ResponseStub {
  status?: number;
  statusText?: string;
  headers: Headers;
}

export interface FetchEvent {
  request: Request;
  response: ResponseStub;
  clientAddress?: string;
  locals: App.RequestEventLocals;
  nativeEvent: H3Event;
}

export interface PageEvent extends RequestEvent {
  complete: boolean;
  nonce?: string;
}

export interface APIEvent extends FetchEvent {
  params: { [key: string]: string };
}

export type APIHandler = (event: APIEvent) => any;

export interface ServerFunctionMeta {
  id: string;
}

declare module "@solidjs/web" {
  interface RequestEvent extends FetchEvent {
    serverOnly?: boolean;
  }
}
