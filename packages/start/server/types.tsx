export type ManifestEntry = {
  type: string;
  href: string;
};

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

export interface RequestContext {
  request: Request;
  responseHeaders: Headers;
  manifest?: Record<string, ManifestEntry[]>;
}

export interface PageContext extends RequestContext {
  routerContext?: RouterContext;
  tags?: TagDescription[];
  setStatusCode(code: number): void;
  fetch(url: string, init: RequestInit): Promise<Response>;
}
