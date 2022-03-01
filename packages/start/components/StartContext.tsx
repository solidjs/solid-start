import { createContext } from "solid-js";
import { RequestContext } from "./StartServer";

export const StartContext = createContext<Partial<RequestContext>>({});

export function StartProvider(props) {
  return <StartContext.Provider value={props.context}>{props.children}</StartContext.Provider>;
}
