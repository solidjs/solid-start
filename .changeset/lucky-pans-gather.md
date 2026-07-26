---
"@solidjs/start": patch
---

Updated dependencies, including `cookie-es` to 3, `shiki` to 4, `srvx` to 0.12.4, `oxc-parser` to 0.141 and `seroval` to 1.5.6. `parseSetCookie` now returns `undefined` for cookies with a forbidden name or an empty name and value, and those cookies are no longer forwarded to nested server function requests.
