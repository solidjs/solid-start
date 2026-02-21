import { createMiddleware } from "@solidjs/start/middleware";
import { csp } from "shieldwall/start";
import { UNSAFE_INLINE } from "shieldwall/start/csp";

export default createMiddleware({
  onRequest: [
    csp({
      extend: "production_basic",
      config: {
        withNonce: false,
        reportOnly: false,
        value: {
          "default-src": ["self"],
          "script-src": ["self", UNSAFE_INLINE, "http:"],
          "style-src": ["self", UNSAFE_INLINE],
          "img-src": ["self", "data:", "https:", "http:"],
          "font-src": ["self"],
          "connect-src": ["self", "ws://localhost:*", "http://localhost:*"],
          "frame-src": ["self"],
          "base-uri": ["self"]
          // "form-action": ["self"]
        }
      }
    })
  ]
});
