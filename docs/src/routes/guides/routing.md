# Routing
- Solid-start uses file based routing.
- Routes are defined in `src/routes` and are automatically loaded by the router.
- Examples of filepaths and corresponding routes:
  - `src/routes/foo/bar.tsx` → `/foo/bar`
  - `src/routes/foo/index.tsx` → `/foo`
  - `src/routes/foo/bar/baz.tsx` → `/foo/bar/baz`
- See the [Layouts](/guides/layouts) section for information on how to define layouts.