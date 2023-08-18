import { createContext } from "solid-js";

export const ServerContext = createContext<{
	tags: any[];
	routes: any;
}>();
