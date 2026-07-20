# `@solidjs/image`

## Install

```bash
npm i @solidjs/image
```

```bash
pnpm add @solidjs/image
```

## Setup

### Vite

```ts
import { imagePlugin } from '@solidjs/image/vite';

export default defineConfig({
  plugins: {
    imagePlugin({
      /**
       * Used to process local image imports
       *
       * example:
       * import myImage from './path/to/my-image.jpg?image';
       */
      local: {
        /**
         * Image formats that can be processed
         */
        input: ['jpeg', 'png'],
        /**
         * Image format for the output images.
         *
         * Take note that each input image will
         * produce a new image for each format
         */
        output: ['jpeg', 'png'],
        /**
         * Sizes of the output images, based on width
         * while retaining the aspect ratio.
         *
         * This option also produces an image for
         * each width and for each output format.
         */
        sizes: [480, 600],
        /**
         * Quality of the processed images
         */
        quality: 80,
        /**
         * Where the processed images as emitted
         */
        publicPath: "public",
      },
      /**
       * Used for remote images
       *
       * example:
       * import myImage from 'image:my-value';
       */
      remote: {
        /**
         * Transforms the right-hand part of the `image:*` string
         */
        transformURL(url) {
          return {
            /**
             * The default image for the given url
             */
            src: {
              source: `https://picsum.photos/seed/${url}/1200/900.webp`,
              width: 1080,
              height: 760,
            },
            /**
             * Variants of the image (format, size) for responsiveness
             */
            variants: [
              {
                path: `https://picsum.photos/seed/${url}/800/600.jpg`,
                width: 800,
                type: "image/jpeg",
              },
              {
                path: `https://picsum.photos/seed/${url}/400/300.jpg`,
                width: 400,
                type: "image/jpeg",
              },
              {
                path: `https://picsum.photos/seed/${url}/800/600.png`,
                width: 800,
                type: "image/png",
              },
              {
                path: `https://picsum.photos/seed/${url}/400/300.png`,
                width: 400,
                type: "image/png",
              },
            ],
          };
        },
      },
    }),
  }
});
```

## Usage

### Local image

```tsx
import { SolidImage as Image } from "@solidjs/image";
import { type JSX, onMount, Show } from "solid-js";

import exampleImage from "../images/example.jpg?image";

interface PlaceholderProps {
  show: () => void;
}

function Placeholder(props: PlaceholderProps): JSX.Element {
  onMount(() => {
    props.show();
  });

  return <div>Loading...</div>;
}

export default function App(): JSX.Element {
  return (
    <div style={{ width: "50vw" }}>
      <Image
        {...exampleImage}
        alt="example"
        fallback={(visible, show) => (
          <Show when={visible()}>
            <Placeholder show={show} />
          </Show>
        )}
      />
    </div>
  );
}
```

### Remote image

```tsx
import { SolidImage as Image } from "@solidjs/image";
import { type JSX, onMount, Show } from "solid-js";

import exampleImage from "image:foobar";

interface PlaceholderProps {
  show: () => void;
}

function Placeholder(props: PlaceholderProps): JSX.Element {
  onMount(() => {
    props.show();
  });

  return <div>Loading...</div>;
}

export default function App(): JSX.Element {
  return (
    <div style={{ width: "50vw" }}>
      <Image
        {...exampleImage}
        alt="example"
        fallback={(visible, show) => (
          <Show when={visible()}>
            <Placeholder show={show} />
          </Show>
        )}
      />
    </div>
  );
}
```
