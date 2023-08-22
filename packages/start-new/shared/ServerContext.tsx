import { createContext, useContext } from "solid-js";
import { PageEvent } from "../server/types";

export const ServerContext = createContext<
  PageEvent & {
    tags: any[];
    routes: any;
  }
>();

export const useRequest = () => {
  return useContext(ServerContext);
};
