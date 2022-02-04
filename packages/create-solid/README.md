---
description: Create Solid apps in one command with create-solid.
---

# Create Solid

The easiest way to get started with Solid is by using `create-solid`. This CLI tool enables you to quickly start building a new Solid application, with everything set up for you. You can create a new app using the default Next.js template, or by using one of the [official Next.js examples](https://github.com/solidjs/solid-start/tree/main/examples). To get started, use the following command:

```bash
#or
npm init solid@next ./my-solid-app

# or
yarn create solid@next ./my-solid-app
```

### Options

`create-next-app` comes with the following options:

- **--ts, --typescript** - Initialize as a TypeScript project.
- **-e, --example [name]|[github-url]** - An example to bootstrap the app with. You can use an example name from the [Next.js repo](https://github.com/vercel/next.js/tree/canary/examples) or a GitHub URL. The URL can use any branch and/or subdirectory.
- **--example-path [path-to-example]** - In a rare case, your GitHub URL might contain a branch name with a slash (e.g. bug/fix-1) and the path to the example (e.g. foo/bar). In this case, you must specify the path to the example separately: `--example-path foo/bar`

### Why use Create Next App?

`create-solid` allows you to create a new Solid app within seconds. It is officially maintained by the creators of Solid, and includes a number of benefits:

- **Interactive Experience**: Running `npm init solid@next` (with no arguments) launches an interactive experience that guides you through setting up a project.
- **Zero Dependencies**: Initializing a project is as quick as one second. Create Solid has zero dependencies.
- **Support for Examples**: Create Solid App can bootstrap your application using an example from the SolidStart official examples collection (e.g. `npm init solid@next --example with-mdx`).
