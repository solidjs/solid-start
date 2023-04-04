import { FetchEvent, FETCH_EVENT } from "../server/types";

export interface APIEvent extends FetchEvent {
  params: { [key: string]: string };
  $type: typeof FETCH_EVENT;
  fetch: (route: string, init: RequestInit, env?: Env, locals?: Record<string, unknown>) => Promise<Response>;
}

export type Route = { path: string; children?: Route[] } & {
  [method in Method]?: ApiHandler | "skip";
};
export type MatchRoute = Route & {
  score: number;
  params: {
    type: "*" | ":";
    name: string;
    index: number;
  }[];
  matchSegments: (string | null)[];
  wildcard: boolean;
};

export type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type ApiHandler = (event: APIEvent) => Response | Promise<Response>;
