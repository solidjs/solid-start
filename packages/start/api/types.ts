import { FetchEvent, FETCH_EVENT } from "../server/types";

export interface ApiFetchEvent extends FetchEvent {
  params: { [key: string]: string };
  $type: typeof FETCH_EVENT;
  fetch: (route: string, init: RequestInit) => Promise<Response>;
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
  matchSegments: string[];
  wildcard: boolean;
};

export type Method = "get" | "post" | "put" | "del" | "patch";
export type ApiHandler = (event: ApiFetchEvent) => Response | Promise<Response>;
