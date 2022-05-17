import { PageContext, RequestContext } from "./types";

import { createContext, createSignal, ParentProps, useContext } from "solid-js";
import { isServer } from "solid-js/web";

export const StartContext = createContext<PageContext>({} as any);

export function StartProvider(props: ParentProps<{ context?: PageContext }>) {
  const [request, setRequest] = createSignal(
    new Request(isServer ? props.context.request.url : window.location.pathname)
  );
  // TODO: throw error if values are used on client for anything more than stubbing
  // OR replace with actual request that updates with the current URL
  return (
    <StartContext.Provider
      value={
        props.context || {
          get request() {
            return request();
          },
          get tags() {
            return [];
          },
          get manifest() {
            return {};
          },
          get routerContext() {
            return {};
          },
          setStatusCode(code: number) {},
          setHeader(name: string, value: string) {}
        }
      }
    >
      {props.children}
    </StartContext.Provider>
  );
}
