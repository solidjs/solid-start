---
"@solidjs/start": patch
---

Stop the dev toolbar's CSS from shipping in production builds. The error boundary statically imports the dev toolbar, whose module imports its stylesheet as a side effect. The toolbar is dead code in production, but the stylesheet survived because the package declared no `sideEffects`, so its styles were bundled into the client CSS. The package now marks only CSS files as having side effects, letting the bundler drop the toolbar and its styles from production output.
