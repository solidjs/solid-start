import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid()],
  
  test: {
environment: "node",   
    browser: {

      provider: "playwright",

      enabled: true,
      // at least one instance is required
      instances: [
        { browser: 'chromium' },
      ],
    }
  }
  
});
