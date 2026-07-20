---
"@solidjs/start": patch
---

fix: run `onBeforeResponse` middleware in declared order (#2131)

Applications that reversed their `onBeforeResponse` arrays as a workaround should restore the intended declaration order.
