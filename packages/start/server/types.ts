import type { JSX } from "solid-js";
import type { EventHandlerRequest, H3Event } from "vinxi/server";

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

export interface FetchEvent extends H3Event<EventHandlerRequest> {
  request: Request;
  clientAddress: string;
  locals: Record<string, unknown>;
}
export interface PageEvent extends FetchEvent {
  manifest: any;
  assets: any;
  routes: any[];
  // prevUrl: string | null;
  // $type: typeof FETCH_EVENT;
  $islands: Set<string>;
  // mutation: boolean;
  response?: Response;
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
