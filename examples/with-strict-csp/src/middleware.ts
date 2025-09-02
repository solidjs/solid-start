import { createMiddleware } from "@solidjs/start/middleware";
import { randomBytes } from "crypto";

const isProd = import.meta.env.PROD;

export default createMiddleware({
  onRequest: event => {
    const nonce = randomBytes(16).toString("base64");

    if (isProd) {
      event.locals.nonce = nonce;
    }

    // Notes:
    // 1. SolidStart uses `eval` for data serialization, which may require you to include the 'unsafe-eval' directive in your CSP.
    //    For more information, see: https://github.com/solidjs/solid-start/issues/1825
    // 2. In development, Vite inlines small CSS files to improve performance, so you'll need to include the 'unsafe-inline' directive in development.
    // 3. During the build process, Vite inlines small assets as data URLs.
    //    Therefore, it's necessary to add `data:` to the relevant directives (e.g., img-src, font-src, etc.).
    //    For more details, see: https://vite.dev/config/build-options.html#build-assetsinlinelimit
    const csp = `
      default-src 'self';
      script-src ${isProd
        ? // Note: The `https:` and `'unsafe-inline'` directives do not reduce the effectiveness of the CSP.
        // They are only fallbacks for older browsers that don't support `'strict-dynamic'`.
        `'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' https: 'unsafe-inline'`
        : "'self' 'unsafe-inline' 'unsafe-eval' https: http:"
      };
      style-src ${isProd ? `'nonce-${nonce}'` : "'self' 'unsafe-inline'"};
      img-src 'self' data:;
      object-src 'none';
      base-uri 'none';
      frame-ancestors 'none';
      form-action 'self';
    `.replace(/\s+/g, " ");

    event.response.headers.set("Content-Security-Policy", csp);
  }
});
