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
  // router matches;
  matches?: ContextMatches[][];
  // redirected url
  url?: string;

  // server route fragments
  replaceOutletId?: string;
  newOutletId?: string;
};

export type IslandManifest = {
  script: ManifestEntry;
  assets: ManifestEntry[];
};

declare global {
  interface Env {
    /**
     * BE CAREFUL WHILE USING. AVAILABLE IN PRODUCTION ONLY.
     */
    manifest?: Record<string, ManifestEntry[] | IslandManifest>;
    /**
     * BE CAREFUL WHILE USING. AVAILABLE IN PRODUCTION ONLY.
     */
    getStaticHTML?(path: string): Promise<Response>;
    /**
     * BE CAREFUL WHILE USING. AVAILABLE IN PRODUCTION ONLY.
     */
    __dev?: {
      /**
       * @warning
       */
      collectStyles?: (matches: string[]) => Promise<Record<string, string>>;
      manifest?: [{ path: string; componentPath: string; id: string }];
    };
  }
}

export interface FetchEvent {
  request: Request;
  env: Env;
  clientAddress: string;
  locals: Record<string, unknown>;
}

export interface ServerFunctionEvent extends FetchEvent {
  fetch(url: string, init: RequestInit): Promise<Response>;
  $type: typeof FETCH_EVENT;
}

export interface PageEvent extends FetchEvent {
  prevUrl: string;
  responseHeaders: Headers;
  routerContext?: RouterContext;
  tags?: TagDescription[];
  setStatusCode(code: number): void;
  getStatusCode(): number;
  fetch(url: string, init: RequestInit): Promise<Response>;
  $type: typeof FETCH_EVENT;
}
