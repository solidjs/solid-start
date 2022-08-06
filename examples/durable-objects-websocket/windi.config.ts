import { defineConfig } from "windicss/helpers";

export default defineConfig({
  extract: {
    include: ["./src/**/*.{ts,tsx,js,jsx}"],
    exclude: ["node_modules"],
  },
});
