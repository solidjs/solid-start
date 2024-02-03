---
section: api
title: RequestEventLocals
order: 99
subsection: Typescript
active: true
---

# RequestEventLocals
SolidStart uses `event.locals` to pass around local context to be used as you see fit. 

When adding fields to `event.locals`, you can let Typescript know the types of these fields like so:

```tsx
declare module "@solidjs/start/server" {
  interface RequestEventLocals {
    myNumber: number;
    someString: string;
  }
}
```
