import { JSX } from "solid-js";

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

export interface FetchEvent {
  request: Request;
  clientAddress: string;
  locals: Record<string, unknown>;
  redirect(url: string, status?: number): void;
  getResponseStatus(): number;
  setResponseStatus(code: number, text?: string): void;
  getResponseHeader(name: string): string | number | string[];
  setResponseHeader(name: string, value: string): void;
  appendResponseHeader(name: string, value: string): void;
  removeResponseHeader(name: string): void;
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
