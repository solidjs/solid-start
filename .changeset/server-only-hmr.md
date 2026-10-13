---
"@solidjs/start": patch
---

Fix hot reloading for components whose root element uses `$ServerOnly`. The first edit threw `template is not a function`, because the Solid compiler leaves `$ServerOnly` templates out of the client bundle and hot reloading needs them to re-run the component. In dev, the client build now keeps these templates. Production builds still leave them out. This needs `babel-plugin-jsx-dom-expressions` 0.40.10 or newer, which fresh installs already get; with an older version the behavior is unchanged.
