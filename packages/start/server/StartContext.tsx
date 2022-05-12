import { RequestContext } from "./types";

import { createContext, PropsWithChildren } from "solid-js";

export const StartContext = createContext<Partial<RequestContext>>({});

export function StartProvider(props: PropsWithChildren<{ context?: RequestContext }>) {
  return (
    <StartContext.Provider value={props.context || {}}>{props.children}</StartContext.Provider>
  );
}
