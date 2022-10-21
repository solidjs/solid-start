import { PageEvent } from "./types";

import { createContext, useContext } from "solid-js";

export const ServerContext = createContext<PageEvent>({} as any);

export const useServerContext = () => {
  return useContext(ServerContext)!;
};
