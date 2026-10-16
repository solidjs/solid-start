---
"@solidjs/start": patch
---

Support a full URL in Vite's `base` so assets can be served from a CDN, completing the base URL prefixing from 2.0.3. Entry, stylesheet, modulepreload and serialized manifest paths no longer collapse `https://` into `https:/`, and server functions post to the path the app is mounted at (`server.baseURL`, else Vite's `base` when it is a plain path, else `/`) instead of the asset base. There is no CDN in development: Vite serves the assets itself, including the public directory, under the URL's path, while the app stays at the root. Root-relative links to public files therefore differ between dev and a build; setting the CDN `base` for production builds only avoids that.
