---
"@solidjs/start": minor
---

- Added "OPTIONS" to the HTTP_METHODS array in packages/start/config/fs-router.js.
  I made this change so developers can handle preflight OPTIONS requests when using SolidStart as a public facing REST API.
  Existing users will not have to change their code. This change only adds an additional feature.
