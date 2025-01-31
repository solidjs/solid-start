# SolidStart

Everything you need to build a Solid project, powered by [`solid-start`](https://start.solidjs.com);

## Creating a project

```bash
# create a new project in the current directory
npm init solid@latest

# create a new project in my-app
npm init solid@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

Solid apps are built with _presets_, which optimise your project for deployment to different environments.

By default, `npm run build` will generate a Node app that you can run with `npm start`. To use a different preset, add it to the `devDependencies` in `package.json` and specify in your `app.config.js`.

## Tailwind CSS bug

This branch reproduces a bug that causes the css output of Tailwind CSS classes that contain the `&` character to transform it into `&amp;`, which breaks it. For example, a class using a "dark theme" variant like this:

```css
.dark\:bg-red-500 {
  &:where(.dark, .dark *) {
    background-color: var(--color-red-500);
  }
}
```

This is actually outputted like this:

```css
.dark\:bg-red-500 {
  &amp;:where(.dark, .dark *) {
    background-color: var(--color-red-500);
  }
}
```

The effect is that the browser cannot parse the contents of the selector, so that class doesn't work and the color is not applied.

See `examples/with-tailwindcss/src/routes/index.tsx` for a live repro.
