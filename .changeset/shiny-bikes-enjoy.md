---
"@solidjs/start": patch
---

Fixed niche edge cases in the server functions dead code removal (DCE) logic:
- Server functions only referenced in event handlers (e.g. `onClick`) now aren't considered unused and work properly.
- Unused variables in server functions no longer lead to compilation errors.
