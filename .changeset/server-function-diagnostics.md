---
"@solidjs/start": patch
---

Report server functions that cannot work instead of compiling them into broken output.

- A `"use server"` function that reads a variable from an enclosing function now fails the build. The function is moved to the top level of its module, so the variable is not in scope when it runs.
- The same check covers `this` and `arguments` in an arrow function, `super`, and private class members.
- A `"use server"` directive in an object or class method now fails the build. It was ignored before, which shipped the method body and the modules it imports to the browser.
- A `"use server"` string that is not the first statement of a module or a function body now logs a warning. It has no effect there.
- An export a `"use server"` module cannot serve now logs a warning that names it. These exports are still left out of the client build.
- A `"use server"` module can now export an anonymous default function. Both `export default async () => {}` and `export default async function () {}` work.
- Server functions are now compiled in `.mts` and `.cts` files.
- Build errors now point at the full path of the file, not just its name.
