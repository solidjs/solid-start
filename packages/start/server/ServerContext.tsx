import { FETCH_EVENT, PageEvent } from "./types";

import { createContext, useContext } from "solid-js";

export const ServerContext = /*#__PURE__*/ createContext<PageEvent>({
  $type: FETCH_EVENT
} as any);

export const useRequest = () => {
  return useContext(ServerContext)!;
};

export const useServerContext = () => {
  throw new Error("useServerContext is deprecated. Use useRequest instead.");
};
