// This file only exists to make the TypeScript tsconfig setting `"moduleResolution": "node"` work.
// See ./server.ts for the server entrypoint and ./browser.ts for the browser entrypoint
import server$ from "./server";
export default server$;
export * from "./server";
