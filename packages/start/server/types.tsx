import { Server } from "http";

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

export type IslandManifest = {
  type: "island";
  script: ManifestEntry;
  assets: ManifestEntry[];
};

export type RouteManifest = {
  type: "route";
  script: ManifestEntry;
  assets: ManifestEntry[];
};

export type StartManifest = {
  [key: string]: RouteManifest | IslandManifest;
  "entry-client": RouteManifest;
  "index.html": RouteManifest;
};

declare global {
  interface Env {
    /**
     * BE CAREFUL WHILE USING. AVAILABLE IN PRODUCTION ONLY.
     */
    manifest?: StartManifest;
    /**
     * BE CAREFUL WHILE USING. AVAILABLE IN PRODUCTION ONLY.
     */
    getStaticHTML?(path: string): Promise<Response>;
    /**
     * BE CAREFUL WHILE USING. AVAILABLE IN DEVELOPMENT ONLY.
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
  httpServer?: Server;
  env: Env;
  fetch(url: string, init?: RequestInit): Promise<Response>;
  clientAddress: string;
  locals: Record<string, unknown>;
}

export interface ServerFunctionEvent extends FetchEvent {
  $type: typeof FETCH_EVENT;
}

export interface PageEvent extends FetchEvent {
  prevUrl: string | null;
  responseHeaders: Headers;
  routerContext: RouterContext & { assets: ManifestEntry[] };
  tags: TagDescription[];
  setStatusCode(code: number): void;
  getStatusCode(): number;
  $type: typeof FETCH_EVENT;
  $islands: Set<string>;
  mutation: boolean;
}
