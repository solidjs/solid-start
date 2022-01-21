import { createContext } from "solid-js";

export const StartContext = createContext<{
  manifest?: Record<string, any>;
  context?: Record<string, any>;
}>({});

export function StartProvider(props) {
  return <StartContext.Provider value={props}>{props.children}</StartContext.Provider>;
}
