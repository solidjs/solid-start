---
section: api
title: dev
order: 1
subsection: CLI
active: true
---

# solid-start dev

##### `solid-start dev` starts a development server backed by [Vite](https://vitejs.dev/).

<div class="text-lg">

```bash
solid-start dev
```

</div>

## Usage

### Open the browser

```bash
solid-start dev --open
```

### Specify a port

```bash
solid-start dev --port 3000
```

### Specify a `vite.config` file

```bash
solid-start dev --config project/vite.config.ts --root project
```

## Reference

- `root`, `-r`: The root directory of the project.
- `port`, `-p`: The port to run the server on.
- `host`, `-h`: The host to run the server on.
- `open`, `-o`: Open the browser to the running server.
- `config`: The path to the Vite config file.