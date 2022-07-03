import { FetchEvent } from "../types";

export type InlineServer<E extends any[], T extends (...args: [...E]) => void> = {
  url: string;
  fetch(init: RequestInit): Promise<Response>;
} & ((...args: [...E]) => ReturnType<T>);

export type ServerFn = (<E extends any[], T extends (...args: E) => void>(
  fn: T
) => (...p: Parameters<T>) => Promise<Awaited<ReturnType<T>>> & { url: string; action: T }) & {
  getHandler: (route: string) => any;
  createHandler: (fn: any, hash: string) => any;
  registerHandler: (route: string, handler: any) => any;
  hasHandler: (route: string) => boolean;
  fetcher: (request: Request) => Promise<Response>;
  setFetcher: (fetcher: (request: Request) => Promise<Response>) => void;
  createFetcher(route: string): InlineServer<any, any>;
  fetch(route: string, init?: RequestInit): Promise<Response>;
} & FetchEvent;
