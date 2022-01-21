import { createContext } from "solid-js";

export const StartContext = createContext<{ manifest?: {}; context?: {} }>({});

export function StartProvider(props) {
  return <StartContext.Provider value={props}>{props.children}</StartContext.Provider>;
}
