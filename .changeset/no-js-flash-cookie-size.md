---
"@solidjs/start": patch
---

Keep the result of a form submitted without JavaScript when its form data is too large for the flash cookie. Browsers silently drop cookies over 4096 bytes, so a large textarea used to make `useSubmission()` come back empty on the page the action redirected to. The form data is now left out of the cookie when it would not fit, the result and error still come through, and a warning is logged on the server.
