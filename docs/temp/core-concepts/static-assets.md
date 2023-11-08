---
section: core-concepts
title: Static Assets
order: 5
active: true
---

# Static Assets

<table-of-contents></table-of-contents>

There are two ways to import static assets into your SolidStart project: using the public directory and using imports.

## Using the public directory

Rich web applications use assets to create visuals. In SolidStart, you can use the `/public` directory to store static assets. They will be served at the exact path they are in relative to the public directory. For example:

```
|-- public
|   favicon.ico                   ->  /favicon.ico
|   |-- images
|   |   |-- logo.png              ->  /images/logo.png
|   |   |-- background.png        ->  /images/background.png
|   |-- models
|   |   |-- player.gltf           ->  /models/player.gltf
|   |-- documents
|   |   |-- report.pdf            ->  /documents/report.pdf
```

If we want to reference the `images/logo.png` file in our public directory, we can reference the absolute path:

```tsx
export default function About() {
  return (
    <>
      <h1>About</h1>
      <img src="/images/logo.png" alt="Solid logo" />
    </>
  );
}
```

This is an ideal use case when we want to have a human-readable, stable reference to a static asset. For example, if we have a PDF file and never want the link to that file to change, we should use the public directory. Common assets you might want to put in the public directory include:

- documents
- service workers
- images, audio, and video
- manifest files
- metadata files (e.g., `robots.txt`, sitemaps)
- favicon

## Importing assets

Vite allows you to import assets directly into your Solid components. For example, the following component imports the `solid.png` file directly.

When you use imports, Vite will create a hashed filename. For example, importing `solid.png` may get hashed as `solid.2d8efhg.png`.

```tsx
import logo from "./solid.png";

export default function About() {
  return (
    <>
      <h1>About</h1>
      <img src={logo} alt="Solid logo" />
      // Renders
      <img src="/assets/solid.2d8efhg.png" alt="Solid logo" />
    </>
  );
}
```

## When to use the public directory versus imports

One of the largest drivers for choosing the public directory versus imports is whether you want the link to your asset to change when you update it. Since you fully control the url path to all public directory assets, you can make sure any links to those assets never change.

When using imports, the filename is hashed and therefore will not be predictable over time. This can be beneficial for cache busting but detrimental if you want to send someone a link to the asset.
