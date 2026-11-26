---
"@solidjs/start": patch
---

Give server functions the same ids when the same code is built in different directories. The ids hashed the module's absolute path, so machines building one deploy in their own directories got different ids and client chunks, even with the same `skewProtection.buildId`: a page from one machine called another with ids it did not know, and its chunks were missing there. The ids now hash the path relative to the Vite root.
