import { FETCH_EVENT, PageEvent } from "./types";

import { createContext, useContext } from "solid-js";

export const ServerContext = createContext<PageEvent>({
  $type: FETCH_EVENT
} as any);

export const useServerContext = () => {
  return useContext(ServerContext)!;
};
