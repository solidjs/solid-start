import { PageFetchEvent } from "./types";

import { createContext } from "solid-js";

export const ServerContext = createContext<PageFetchEvent>({} as any);
