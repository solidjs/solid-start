import { XataClient } from "./xata.codegen.server";

export const xata = new XataClient({
  apiKey: import.meta.env.VITE_XATA_API_KEY,
});
