---
"@solidjs/start": patch
---

Make `solid-js` a peer dependency instead of a regular one. When an app's `solid-js` version was outside the range SolidStart asked for, package managers installed a second copy just for SolidStart. The two copies did not share reactive context, so client-side navigation broke with `TypeError: Cannot read properties of null (reading 'push')`. SolidStart now uses the app's `solid-js`, and a version outside the supported range shows up as a peer dependency warning at install time.
