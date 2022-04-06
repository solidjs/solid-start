import { defineConfig } from "vite";
import solid from "solid-start";
import windicss from "vite-plugin-windicss";

export default defineConfig({
  plugins: [
    windicss(),
    solid({
      // adapter: "solid-start-node"
      adapter: "solid-start-cloudflare-workers"
    })
  ]
  // define: {
  //   "process.env.NODE_ENV": `"production"`,
  //   "process.env.TEST_ENV": `""`
  // }
});
