---
"@solidjs/start": patch
---

Fix actions returning `json()` or `reload()` leaving no-JS form submissions stranded on the `/_server` endpoint. These responses carry a value rather than a destination, so the redirect issued for progressive-enhancement submissions had no `Location` header. It now falls back to the submitting page, and the response value is unwrapped into the flash cookie so `useSubmission().result` matches the JS path.
