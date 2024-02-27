---
section: api
title: vinxi dev
order: 1
subsection: CLI
active: true
---

# vinxi dev

##### `vinxi dev` starts a development server backed by [Vinxi](https://vinxi.vercel.app/).

<div class="text-lg">

```bash
vinxi dev
```

</div>

## Usage

### Specify a port

```bash
vinxi dev --port 3000
```

### Specify a `app.config` file

```bash
vinxi dev --config project/app.config.ts --root project
```

## Reference

- `port`, `-p`: The port to run the server on.
- `config`: The path to the Vite config file.
