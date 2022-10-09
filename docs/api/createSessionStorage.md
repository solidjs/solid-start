---
section: api
title: createSessionStorage
order: 9
subsection: Session
---

# createSessionStorage

##### `createSessionStorage` creates a server-side session storage that persists `session-id` in a cookie.

<div class="text-lg">

```tsx twoslash
import { createSessionStorage, SessionIdStorageStrategy } from 'solid-start'
let storageOptions: SessionIdStorageStrategy = {} as unknown as SessionIdStorageStrategy;
// ---cut---
const storage = createSessionStorage(storageOptions)
```

</div>

<table-of-contents></table-of-contents>

## Usage

