# @solidjs/image

Image component and Vite plugin for Solid apps. Provides an `Image` component, a build-time Vite plugin for local and remote image sources, and opt-in TypeScript module declarations.

## Install

```bash
pnpm add @solidjs/image
```

## Quick Start

1) Add the Vite plugin

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { imagePlugin } from "@solidjs/image/vite";

export default defineConfig({
  plugins: [
    imagePlugin({
      local: {
        sizes: [480, 800, 1200],
        quality: 80,
        publicPath: "public",
      },
      remote: {
        transformURL(url) {
          return {
            src: {
              source: `https://picsum.photos/seed/${url}/1200/900.webp`,
              width: 1200,
              height: 900,
            },
            variants: [
              { path: `https://picsum.photos/seed/${url}/800/600.jpg`, width: 800, type: "image/jpeg" },
              { path: `https://picsum.photos/seed/${url}/400/300.jpg`, width: 400, type: "image/jpeg" },
            ],
          };
        },
      },
    }),
  ],
});
```

2) Opt in to module declarations

```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["@solidjs/image/env"]
  }
}
```

3) Use the component

```tsx
import { Image } from "@solidjs/image";
import exampleImage from "./images/example.jpg?image";

export default function Example() {
  return (
    <Image
      {...exampleImage}
      alt="Example"
      fallback={(visible, show) => (
        visible() ? <div onLoad={show}>Loading...</div> : null
      )}
    />
  );
}
```

## Local Images

Use the `?image` query to generate responsive variants at build time:

```tsx
import hero from "./hero.jpg?image";

<Image {...hero} alt="Hero" fallback={(visible, show) => visible() && <div onLoad={show} />} />
```

Configuration options (local):

```ts
imagePlugin({
  local: {
    sizes: [480, 800, 1200],
    input: ["jpeg", "png", "webp"],
    output: ["jpeg", "webp"],
    quality: 80,
    publicPath: "public",
  },
});
```

## Remote Images

Use the `image:` protocol with a `transformURL` handler:

```tsx
import avatar from "image:users/123";

<Image {...avatar} alt="User" fallback={(visible, show) => visible() && <div onLoad={show} />} />
```

```ts
imagePlugin({
  remote: {
    transformURL(url) {
      return {
        src: {
          source: `https://cdn.example.com/${url}.webp`,
          width: 600,
          height: 600,
        },
        variants: [
          { path: `https://cdn.example.com/${url}.webp`, width: 600, type: "image/webp" },
          { path: `https://cdn.example.com/${url}.jpg`, width: 600, type: "image/jpeg" },
        ],
      };
    },
  },
});
```

## Notes

- The Vite plugin is **not** automatically registered in SolidStart. Add it explicitly in user land.
- The module declarations are opt-in via `@solidjs/image/env`.
- The plugin uses `sharp` to generate local variants (Node runtime only).

## SolidStart

Register the Vite plugin in your app config:

```ts
// app.config.ts
import { defineConfig } from "@solidjs/start/config";
import { imagePlugin } from "@solidjs/image/vite";

export default defineConfig({
  vite: {
    plugins: [imagePlugin()],
  },
});
```

## API

### `Image`

```ts
interface ImageProps<T> {
  src: { source: string; width: number; height: number };
  alt: string;
  transformer?: { transform: () => StartImageVariant | StartImageVariant[] };
  onLoad?: () => void;
  fallback: (visible: () => boolean, onLoad: () => void) => JSX.Element;
  crossOrigin?: JSX.HTMLCrossorigin;
  fetchPriority?: "high" | "low" | "auto";
  decoding?: "sync" | "async" | "auto";
}
```

### `imagePlugin`

```ts
interface StartImageOptions {
  local?: {
    sizes: number[];
    input?: ("png" | "jpeg" | "webp" | "avif")[];
    output?: ("png" | "jpeg" | "webp" | "avif")[];
    quality: number;
    publicPath?: string;
  };
  remote?: {
    transformURL(url: string): Promise<{
      src: { source: string; width: number; height: number };
      variants: StartImageVariant | StartImageVariant[];
    }> | {
      src: { source: string; width: number; height: number };
      variants: StartImageVariant | StartImageVariant[];
    };
  };
}
```
