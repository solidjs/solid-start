---
section: api
title: build
order: 2
subsection: CLI
active: true
---

# solid-start build

##### `solid-start build` bundles your server and client using [Vite](https://vitejs.dev/).

<div class="text-lg">

```bash
solid-start build
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Build for production

```bash
solid-start build
```

### Specify a `vite.config` file

```bash
solid-start build --config project/vite.config.ts --root project
```

## Reference

- `root`, `-r`: The root directory of the project
- `config`: The path to the Vite config file