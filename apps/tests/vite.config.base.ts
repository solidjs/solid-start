import { defineConfig, mergeConfig } from "vite";
import config from "./vite.config.ts";

// A CDN base, as a production build would set it, kept for dev on purpose: dev
// has no CDN, so Vite serves the assets itself under the URL's path, /some/prefix/,
// while the app stays at the root, as it would with the assets on the CDN.
export default mergeConfig(config, defineConfig({ base: "https://cdn.example.com/some/prefix/" }));
