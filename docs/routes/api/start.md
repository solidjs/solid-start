---
section: api
title: vinxi start
order: 2
subsection: CLI
active: true
---

# vinxi start

##### `vinxi start` starts the production build with a local version of preset.

<div class="text-lg">

```bash
vinxi start
```

</div>

## Usage

Remember to run `vinxi build` before running `vinxi start`.

### Specify a port

```bash
vinxi start --port 3000
```

### Specify a `app.config` file

```bash
vinxi start --config project/app.config.ts --root project
```

## Reference

- `port`, `-p`: The port to run the server on.
- `config`: The path to the Vite config file.
