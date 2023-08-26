export const FETCH_EVENT = "$FETCH";

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
  // router matches;
  matches: ContextMatches[][];
  // redirected url
  url: string;

  // server route fragments
  replaceOutletId: string;
  newOutletId: string;
  partial: boolean;
  nextRoute: any;
  prevRoute: any;
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
  prevUrl: string | null;
  routerContext: RouterContext;
  tags: TagDescription[];
  $type: typeof FETCH_EVENT;
  $islands: Set<string>;
  mutation: boolean;
}
