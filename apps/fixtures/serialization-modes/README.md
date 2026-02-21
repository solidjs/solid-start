# Serialization checks

this fixture is designed to point out the differences between Seroval 2 modes.

```ts
export default defineConfig({
  middleware: "./src/middleware.ts",
  serialization: {
    mode: "js" // "json"
  }
});
```

On JS mode, seroval will use a custom serializer, while this improves performance and reduces payload size, it runs an `eval()` on client-side,
so a strict CSP will block deserialization. On JSON mode, the payload will be slightly larger, but deserialization happens via `JSON.parse` and thus CSP will not block it.

> [!IMPORTANT]
> For backwards compatibility, `v1` has "js" as the default.
> On `v2`, "json" is the new default.
