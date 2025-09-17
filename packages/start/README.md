<div align="center">

[![Banner](https://assets.solidjs.com/banner?project=Start&type=core)](https://github.com/solidjs)

[![Version](https://img.shields.io/npm/v/@solidjs/start.svg?style=for-the-badge&color=blue&logo=npm)](https://npmjs.com/package/@solidjs/start)
[![Downloads](https://img.shields.io/npm/dm/@solidjs/start.svg?style=for-the-badge&color=green&logo=npm)](https://npmjs.com/package/@solidjs/start)
[![Stars](https://img.shields.io/github/stars/solidjs/solid-start?style=for-the-badge&color=yellow&logo=github)](https://github.com/solidjs/solid-start)
[![Discord](https://img.shields.io/discord/722131463138705510?label=join&style=for-the-badge&color=5865F2&logo=discord&logoColor=white)](https://discord.com/invite/solidjs)
[![Reddit](https://img.shields.io/reddit/subreddit-subscribers/solidjs?label=join&style=for-the-badge&color=FF4500&logo=reddit&logoColor=white)](https://reddit.com/r/solidjs)

</div>

**SolidStart** brings fine-grained reactivity fullstack with full flexibility. Built with features like unified rendering and isomorphic code execution, SolidStart enables you to create highly performant and scalable web applications.

Explore the official [documentation](https://docs.solidjs.com/solid-start) for detailed guides and examples.

## Core Features

- **All Rendering Modes**:
  - Server-Side Rendering _(SSR)_ with sync, async, and stream [modes](https://docs.solidjs.com/solid-start/reference/server/create-handler)
  - Client-Side Rendering _(CSR)_
  - Static Site Generation _(SSG)_ with route [pre-rendering](https://docs.solidjs.com/solid-start/building-your-application/route-prerendering)
- **TypeScript**: Full integration for robust, type-safe development
- **File-Based Routing**: Intuitive routing based on your project’s file structure
- **API Routes**: Dedicated server-side endpoints for seamless API development
- **Streaming**: Efficient data rendering for faster page loads
- **Build Optimizations**: Code splitting, tree shaking, and dead code elimination
- **Deployment Adapters**: Easily deploy to platforms like Vercel, Netlify, Cloudflare, and more

## Getting Started

### Installation

Create a SolidStart template project with your preferred package manager

```bash
# using npm
npm create solid@latest -- -s
```

```bash
# using pnpm
pnpm create solid@latest -s
```

```bash
# using bun
bun create solid@latest --s
```

### Project Structure

- `public/`: Static assets like icons, images, and fonts
- `src/`: Core application (aliased to `~/`)
  - `routes/`: File-based routing for pages and APIs
  - `app.tsx`: Root component of your application
  - `entry-client.tsx`: Handles client-side hydration
  - `entry-server.tsx`: Manages server-side request handling
- **Configuration Files**: `app.config.ts`, `package.json`, and more

Learn more about [routing](https://docs.solidjs.com/solid-start/building-your-application/routing)

## Adapters

Configure adapters in `app.config.ts` to deploy to platforms like Vercel, Netlify, Cloudflare, and others

```ts
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  ssr: true, // false for client-side rendering only
  server: { preset: "vercel" }
});
```

Presets also include runtimes like Node.js, Bun or Deno. For example, a preset like `node-server` enables hosting on your server.  
Learn more about [`defineConfig`](https://docs.solidjs.com/solid-start/reference/config/define-config)

## Building

Generate production-ready bundles

```bash
npm run build # or pnpm build or bun build
```

After the build completes, you’ll be guided through deployment for your specific preset.
