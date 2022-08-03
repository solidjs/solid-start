import { PageEvent } from "./types";

import { createContext } from "solid-js";

export const ServerContext = createContext<PageEvent>({} as any);
