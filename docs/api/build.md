---
section: api
title: build
order: 2
subsection: CLI
active: true
---

# `solid-start build`

<table-of-contents></table-of-contents>

# `solid-start dev`

##### `solid-start dev` starts a development server backed by [Vite](https://vitejs.dev/)

<div class="text-lg">

```bash
solid-start build
```

</div>

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

- `root, -r `: The root directory of the project
- `config   `: The path to the Vite config file