---
section: api
title: start
order: 2
subsection: CLI
active: true
---

# solid-start start

##### `solid-start start` starts the production build with a local version of adapter.

<div class="text-lg">

```bash
solid-start start
```

</div>

## Usage

Remember to run `solid-start build` before running `solid-start start`.

### Open the browser

```bash
solid-start start --open
```

### Specify a port

```bash
solid-start start --port 3000
```

### Specify a `vite.config` file

```bash
solid-start start --config project/vite.config.ts --root project
```

## Reference

- `port`, `-p`: The port to run the server on.
- `open`, `-o`: Open the browser to the running server.
- `config`: The path to the Vite config file.