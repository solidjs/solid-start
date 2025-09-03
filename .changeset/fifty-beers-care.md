---
"@solidjs/start": patch
---

Fix CSS preloading on SSR

Currently, SolidStart only preloads `<link rel="modulepreload" />`. That causes stylesheets modules to not really work if imported in subroutes.

While `DeVinxi` will have a better way to handle assets and we're reevaluating our whole resource manifests, this small fix seems to be justifiable for most apps and harmless for the ones who were unaffected by this bug.

It also cleans the code up a bit by replacing `ts-ignore` with `ts-expect-error` and a reason - and adding a few extra comments to logic that can potentially be reused during our port.
