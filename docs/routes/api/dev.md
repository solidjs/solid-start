---
section: api
title: dev
order: 1
subsection: CLI
active: true
---

# solid-start dev

##### `solid-start dev` starts a development server backed by [Vinxi](https://vinxi.vercel.app/).

<div class="text-lg">

```bash
solid-start dev
```

</div>

## Usage

### Specify a port

```bash
solid-start dev --port 3000
```

### Specify a `vite.config` file

```bash
solid-start dev --config project/vite.config.ts --root project
```

## Reference

- `port`, `-p`: The port to run the server on.
- `config`: The path to the Vite config file.