---
section: api
title: vinxi build
order: 2
subsection: CLI
active: true
---

# vinxi build

##### `vinxi build` bundles your server and client using [Vinxi](https://vinxi.vercel.app/).

<div class="text-lg">

```bash
vinxi build
```

</div>

## Usage

### Build for production

```bash
vinxi build
```

### Specify a `app.config` file

```bash
vinxi build --config project/app.config.ts --root project
```

## Reference

- `root`, `-r`: The root directory of the project
- `config`: The path to the Vite config file
