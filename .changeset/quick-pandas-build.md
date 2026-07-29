---
"@solidjs/start": patch
---

Fix production builds shipping without client assets (and 500ing from a manifest-less server fallback) when composed with nitro, by bumping vite-plugin-solid to 3.0.0-next.20: its client-build-first `buildApp` hooks now run at normal order and defer to nitro's orchestrator instead of building the client before nitro's pre-order hook wipes `.output/`. A temporary workaround that filtered those hooks out of the solid() plugin set has been removed.
