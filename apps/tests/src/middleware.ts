import { createMiddleware } from "@solidjs/start/middleware";
import { csp, csrf, securityHeaders } from "shieldwall/start";

export default createMiddleware({
  onRequest: [
    csrf,
    securityHeaders(),
    csp({
      extend: "production_basic",
      config: {
        withNonce: true,
        reportOnly: true,
        value: {
          "default-src": ["self"],
          "script-src": ["self"],
          "style-src": ["self"],
          "img-src": ["self", "data:", "https:"],
          "font-src": ["self"],
          "connect-src": ["self", "ws://localhost:3000"],
          "frame-src": ["self"],
          "base-uri": ["self"],
          "form-action": ["self"]
        }
      }
    })
  ]
});
