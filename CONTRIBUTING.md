# Contributing

Thank you for your interest in contributing to **SolidStart**.
We welcome contributions including bug fixes, feature enhancements, documentation improvements, and more.

## Creating a Template

We do not maintain official templates and integration in this monorepo.
Instead, please head over to [solidjs/templates](https://github.com/solidjs/templates) to submit your contribution.

## Documentation

We always want help and creative ways of explaining how to take the best out of SolidStart.
Alas, this is not the right place to do it, please head over to [SolidDocs](https://github.com/solidjs/solid-docs) and offer contribution to the official documentation!

## Feature Request

> [!IMPORTANT]
> Do not create a PR without first discussion in an issue

If there's a new feature you'd like to request you can:

1. Create an issue and make your pitch. Be sure to explain the value proposition in a way that will benefit most users.

2. If it's a more general concept, feel free to open a [Discussion](https://github.com/solidjs/solid-start/discussions) in the **Idea** category.

A new **primitive** follows the same criteria as issues, please create an issue for it to be discussed before hand.

Primitives that depend on multiple external dependencies and 3rd party integrations are generally not a good fit to live inside this monorepo, we still welcome you to create it and share with the ecosystem.
Reach out in a [Discussion](https://github.com/solidjs/solid-start/discussions) in the **showcase** session and we'll amplify as much as we can!

## Found a Bug

If you believe you found a bug, we appreciate you creating an issue.
Issues without a reproduction or PR link will be **automatically closed**.

To speed up triaging, we recommend 2 strategies:

### Minimal Reproduction

Create a **minimal** reproduction either in a remote IDE or in an open-source repository and add a link to your issue.

We recommend using the `create-solid` package with the **basic** setting.

| Package Manager | Command                                    |
| --------------- | ------------------------------------------ |
| pnpm            | `pnpm create solid -s -t basic`            |
| npm             | `npm create solid -s -t basic`             |
| yarn            | `yarn create solid -s -t basic`            |
| bun             | `bun create solid -s -t basic`             |
| deno            | `deno run -A npm:create-solid -s -t basic` |

### Failing Test PR

You can also fork this repository and go to `apps/tests`.
There we have an app with all default configurations and many routes.
Create a new route, a Cypress assertion to it and open a PR with the failing test-case.

Once the PR is there, **create an issue** and link the PR (mention the PR as you'd mention a person in the issue description and vice-versa).

> [!IMPORTANT]
> Mark the **allow edit by the maintainers** so we can more easily investigate the failing test and propose a fix. Otherwise we may need to close your PR and cherry-pick your commit.

---

If you have read all the way here, you're already a champ! 🏆
Thank you.
