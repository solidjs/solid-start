import type { JSX } from "solid-js";
import { HTTPEventSymbol, type EventHandlerRequest, type H3Event } from "vinxi/http";

// export const FETCH_EVENT = "$FETCH";

export type DocumentComponentProps = {
  assets: JSX.Element;
  scripts: JSX.Element;
  children: JSX.Element;
}

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
  clientAddress: string;
  locals: RequestEventLocals;
  nativeEvent: H3Event<EventHandlerRequest>;
  [HTTPEventSymbol]: H3Event<EventHandlerRequest>;
}
export interface RequestEventLocals {
  [key: string | symbol]: any;
}
export interface PageEvent extends FetchEvent {
  manifest: any;
  assets: any;
  routes: any[];
  // prevUrl: string | null;
  // $type: typeof FETCH_EVENT;
  $islands: Set<string>;
  // mutation: boolean;
}

export interface APIEvent extends FetchEvent {
  params: { [key: string]: string };
}

export interface APIHandler {
  (event: APIEvent): Promise<any>;
}

declare module "solid-js/web" {
  interface RequestEvent extends FetchEvent {
    serverOnly?: boolean;
  }
}
