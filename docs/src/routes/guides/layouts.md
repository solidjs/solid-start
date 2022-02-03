# Layouts

- The root layout goes in `src/root.tsx`.
- Any nested layouts go into a file named after the directory they're in. So, for example, `src/routes/guides.tsx` would be the layout for all files in the `src/routes/guides` directory.
- You can use the `<Outlet>` component to render the content of a layout.