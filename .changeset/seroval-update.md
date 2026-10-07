---
"@solidjs/start": patch
---

Update seroval and seroval-plugins to 1.6.8.

seroval 1.6.8 validates decoded nodes more strictly (a promise cannot settle to another promise, and stream, sequence, and plugin inputs must have the expected shape) and lets `maxBase64Length` configure the 1,000,000-character limit on binary values that 1.5 already enforced. It also enables the `Temporal` feature by default. Apps on `solid-js` 1.9.16 or later share a single seroval copy with `@solidjs/start`; older `solid-js` versions pin seroval 1.5 and will install a second copy.
