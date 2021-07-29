import { createContext } from "solid-js";

export const StartContext = createContext<{ manifest?: {}; context: {}, port?: number }>({});

export function StartProvider(props) {
  return <StartContext.Provider value={props}>{props.children}</StartContext.Provider>;
}
