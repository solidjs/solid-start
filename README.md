[![Banner](https://assets.solidjs.com/banner?project=Start&type=core)](https://github.com/solidjs)

[![Version](https://img.shields.io/npm/v/@solidjs/start.svg?style=for-the-badge&color=blue)](https://www.npmjs.com/package/@solidjs/start)
[![Downloads](https://img.shields.io/npm/dm/@solidjs/start.svg?style=for-the-badge&color=blue)](https://www.npmjs.com/package/@solidjs/start)
[![Stars](https://img.shields.io/github/stars/solidjs/solid-start?style=for-the-badge&color=blue)](https://github.com/solidjs/solid-start)
[![Discord](https://img.shields.io/discord/722131463138705510?style=for-the-badge&color=blue)](https://discord.com/invite/solidjs)
[![Reddit](https://img.shields.io/reddit/subreddit-subscribers/solidjs?style=for-the-badge&color=blue)](https://www.reddit.com/r/solidjs/)

SolidStart brings fine-grained reactivity fullstack with full flexibility. Built with features like unified rendering and isomorphic code execution, SolidStart enables you to create highly performant and scalable web applications. Explore the official [documentation](https://docs.solidjs.com/solid-start) for detailed guides and examples.

## Core Features

- **All Rendering Modes**:
  - Server-Side Rendering (SSR) with synchronous, asynchronous, and streaming options
  - Client-Side Rendering (CSR)
  - Static Site Generation (SSG)
- **TypeScript**: Full integration for robust, type-safe development
- **File-Based Routing**: Intuitive routing based on your project’s file structure
- **API Routes**: Dedicated server-side endpoints for seamless API development
- **Streaming**: Efficient data rendering for faster page loads
- **Build Optimizations**: Code splitting, tree shaking, and dead code elimination
- **Deployment Adapters**: Easily deploy to platforms like Vercel, Netlify, Cloudflare, and more

## Getting Started

### Installation

Create a template project with your preferred package manager:

```bash
# using npm
npm create solid@latest -- --solidstart
# using pnpm
pnpm create solid@latest --solidstart
# using bun
bun create solid@latest --solidstart
```

1. Follow the CLI prompts to set up your project.
2. Navigate to your project directory and install dependencies:

```bash
cd <project-name>
npm install # or pnpm install or bun install
```

3. Start the development server:

```bash
npm run dev # or pnpm dev or bun dev
```

### Project Structure

- `public/`: Static assets like icons, images, and fonts
- `src/`: Core application (aliased to `~/`)
  - `routes/`: File-based routing for pages and APIs
  - `app.tsx`: Root component of your application
  - `entry-client.tsx`: Handles client-side hydration
  - `entry-server.tsx`: Manages server-side request handling
- **Configuration Files**: `app.config.ts`, `package.json`, and more

Learn more about routing in the [documentation](https://docs.solidjs.com/solid-start/building-your-application/routing).

## Configuration

Configure adapters in `app.config.ts` to deploy to platforms like Vercel, Netlify, Cloudflare, and others:

```ts
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  ssr: true, // Set to false for client-side rendering
  server: { preset: "vercel" },
});
```

Presets also support runtimes like Node.js, Bun or Deno. For example, the `node-server` preset enables hosting on your server. Learn more about [`defineConfig`](https://docs.solidjs.com/solid-start/reference/config/define-config).

## Building for Production

Generate production-ready bundles:

```bash
npm run build # or pnpm build or bun build
```

The output is saved to the `dist/` directory. Then, start the server:

```bash
npm start # or pnpm start or bun start
```

## Contributing

Join the SolidJS community and contribute!

- [Discord](https://discord.com/invite/solidjs): Ask for help and discuss ideas
- [Issues](https://github.com/solidjs/solid-start/issues): Report bugs or suggest features
- [Docs Issues](https://github.com/solidjs/solid-docs/issues): Report documentation issues

<details>
  <summary><h3>Development Setup</h3></summary>

Use a Node.js version manager compatible with `.node-version`. We recommend [asdf-vm](https://asdf-vm.com/) for macOS and Linux users.

### Monorepo & Package Manager

SolidStart uses `pnpm` as the package manager. Install it globally:

```bash
npm install -g pnpm
```

Install dependencies for the monorepo:

```bash
pnpm install
```

Build the project:

```bash
pnpm build
```

### Monorepo & `package.json` Workspaces

If using a monorepo with `package.json` `"workspaces"` (e.g., [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/)), ensure `@solidjs/start` is not hoisted. Add it to the `"nohoist"` field in the workspace root or project root:

**Workspace Root Example**:

```jsonc
{
  "workspaces": {
    "packages": [
      /* ... */
    ],
    "nohoist": ["**/@solidjs/start"]
  }
}
```

**Project Root Example**:

```jsonc
{
  "workspaces": {
    "nohoist": ["@solidjs/start"]
  }
}
```

For **Yarn v2+**, use `installConfig` to prevent hoisting:

```jsonc
{
  "installConfig": {
    "hoistingLimits": "dependencies"
  }
}
```

**Note**: Add `@solidjs/start` as a `devDependency` in the child `package.json` to ensure the `/node_modules/@solidjs/start/runtime/entry.jsx` script is available.

</details>
