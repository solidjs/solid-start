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
}

export interface PageContext extends RequestContext {
  manifest: Record<string, ManifestEntry[]>;
  routerContext?: RouterContext;
  tags?: TagDescription[];
  setStatusCode(code: number): void;
  setHeader(name: string, value: string): void;
}
