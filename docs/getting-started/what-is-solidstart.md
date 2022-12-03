---
title: What is SolidStart?
section: getting-started
order: 1
active: true
---

# What is SolidStart?

<aside title="Beware of dragons" type="warning">
  We are very excited about SolidStart, but it is currently in beta. There will very likely be <b>bugs and
  missing documentation</b>. Come at it with a growth attitude, have fun, and don't use it yet for
  anything critical. If all this darkness doesn't faze you, press onward, and consider joining the
  <a href="https://discord.com/invite/solidjs" target="_blank">Discord</a> to ask questions. We would love to meet you.
</aside>

Web applications often comprise many components: databases, servers, front-ends, bundlers, data fetching/mutations, caching, and infrastructure. Orchestrating these components is challenging and often requires a large amount of shared state and redundant logic across the application stack.

Enter SolidStart: a meta-framework that provides many of these components out-of-the-box and integrates them seamlessly!

SolidStart is considered a _meta-framework_ (a framework built on top of another framework) because, at its core, SolidStart is powered by [SolidJS](https://solidjs.com) and the [Solid router](https://github.com/solidjs/solid-router).

SolidStart enables you to render your application in different ways depending on what's best for your use case:

- Client-side rendering (CSR)
- Server-side rendering (SSR)
- Streaming SSR
- Static site generation (SSG)

If you're not familiar with these, that's okay! As we progress through these docs, we'll talk a bit about different ways to render your applications and help you choose the best fit.

One of the driving principles of SolidStart is that code should be _isomorphic_&mdash;you should be able to write code once, and it will run correctly regardless of whether it's being run on the client or server. As we move through the docs, we'll discover just how powerful isomorphism is!

## Features

SolidStart touts the following feature set:

- **Fine-grained reactivity.** Since SolidStart is a SolidJS meta-framework, it benefits from the fine-grained reactivity offered by SolidJS.
- **Isomorphic, nested routing.** You write the same routes regardless of whether the page is rendered on the client or server. Route nesting provides parent-child relationships that simplify application logic.
- **Multiple rendering modes.** SolidStart can be used to create CSR, SSR, streaming SSR, or SSG applications.
- **Command Line Interface (CLI) and templates.** Get up and running quickly with starters.
- **Deployment adapters.** SolidStart provides adapters to support deployment to your favorite platform&mdash;Netlify, Vercel, AWS, and Cloudflare, to name a few.

## Prerequisites

We recommend that you know HTML, CSS, and JavaScript before digging in to SolidStart. Since SolidStart is a SolidJS meta-framework, we also recommend you know SolidJS prior to digging in to these docs (or at least [take the SolidJS tutorial](https://www.solidjs.com/tutorial)).

## SolidStart is in Beta!

We're very excited that you're checking out the SolidStart Beta release! Since SolidStart is in beta, you may find some bugs as you explore the framework. We would appreciate if you report these bugs to us using [GitHub Issues](https://github.com/solidjs/solid-start/issues).

Beta means that while we are happy with the current state of the APIs, we are still learning by working with all of you. There is still opportunities for improvement and some changes before we reach 1.0. Thank you all for your patience, and we hope you enjoy exploring what is possible with SolidStart.
