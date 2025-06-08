import { createMiddleware } from "@solidjs/start/middleware";
import { randomBytes } from "crypto";

const isProd = import.meta.env.PROD;

export default createMiddleware({
  onRequest: event => {
    const nonce = randomBytes(16).toString("base64");

    event.locals.nonce = nonce;

    // Notes:
    // 1. SolidStart uses `eval` for data serialization, which may require you to add 'unsafe-eval' to your CSP.
    //    For more information, see: https://github.com/solidjs/solid-start/issues/1825
    // 2. In development, Vite inlines small CSS files to enhance performance, so you will need to include 'unsafe-inline' in development mode.
    // 3. During the build process, Vite inlines small assets as data URLs. Therefore, it's necessary to add data: to the relevant directives (e.g., img-src, font-src, etc.)
    //    For more details, see: https://vite.dev/config/build-options.html#build-assetsinlinelimit
    const csp = `
      default-src 'self';
      script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval';
      style-src 'self' ${isProd ? "" : "'unsafe-inline'"};
      img-src 'self' ${isProd ? "" : "data:"};
      object-src 'none';
      base-uri 'none';
      frame-ancestors 'none';
      form-action 'self';
    `.replace(/\s+/g, " ");

    event.response.headers.set("Content-Security-Policy", csp);
  }
});
