---
"@solidjs/start": patch
---

Speed up the server function and lazy transforms.

- Modules without `"use server"` are no longer parsed by the server function transform.
- The server build no longer parses a module with Babel only to add its lazy id.
- Modules with many server functions compile about 4 times faster.
- A module with a server function no longer fails to compile when it has an unused `for...of` or `for...in` loop variable, or a chain of unused declarations.
