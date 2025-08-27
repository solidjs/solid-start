import { defineConfig } from "vite";
import { solidStart } from "@solidjs/start/config";

export default defineConfig({
    server: {
        port: 3000,
    },
    plugins: [solidStart()]
});
