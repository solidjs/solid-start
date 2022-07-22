export type ManifestEntry = {
  type: string;
  href: string;
};

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
  matches?: ContextMatches[][];
  url?: string;
};

export interface FetchEvent {
  request: Request;
  env: {
    manifest?: Record<string, ManifestEntry[]>;
    collectStyles?: (matches: string[]) => Promise<Record<string, string>>;
    devManifest: [{ path: string; componentPath: string; id: string }];
  };
}

export interface ServerFunctionEvent extends FetchEvent {
  fetch(url: string, init: RequestInit): Promise<Response>;
  $type: typeof FETCH_EVENT;
}

export interface PageEvent extends FetchEvent {
  responseHeaders: Headers;
  routerContext?: RouterContext;
  tags?: TagDescription[];
  setStatusCode(code: number): void;
  getStatusCode(): number;
  fetch(url: string, init: RequestInit): Promise<Response>;
  $type: typeof FETCH_EVENT;
}
