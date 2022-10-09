---
section: api
title: createRouteAction
order: 8
subsection: Actions
---

# createRouteAction

##### `createRouteAction` creates a controller for managing the submissions of an async user action

<div class="text-lg">

```tsx twoslash
import { createRouteAction } from 'solid-start'
// ---cut---
const [acting, act] = createRouteAction(async (args) => {
  // do something
})
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Invalidating specific routeData resources after an action

```tsx twoslash

import { createRouteAction, createRouteData } from 'solid-start'
import { redirect } from 'solid-start/server'
import { Show, For } from 'solid-js'

// ---cut---
function Page() {
  const bag = createRouteData(async () => {
    return await (await fetch('https://hogwarts.deno.dev/bag', {
      method: 'GET',
    })).json() as string[]
  }, { key: 'bag' })

  const [buyingWand, buyWand] = createRouteAction(async (wand: string) => {
    await fetch('https://hogwarts.deno.dev/store/buy', {
      body: JSON.stringify({ wand }),
      method: 'POST',
    })
    return redirect('/bag');
  }, {
    invalidate: ['bag'],
  })

  return (
    <div>
      <For each={bag()}>{item => <div>{item}</div>}</For>
      <button onClick={() => buyWand('elder')}>Buy</button>
      <Show when={buyingWand.pending}><div>Buying now...</div></Show>
    </div>
  )
}

```

## Reference

### `createRouteAction(action, options)`

`createRouteAction` is a hook that returns a tuple of two values: The first item in the tuple is the read side of the action. It a reactive object maintaining the state of the submissions of the action. The second item in the tuple is a function used to dispatch the action. 

The second item also has another property called `Form` which is a progressively enhanced version of the `form` element. It is a component that can be used to submit the action.


#### Returns

`[acting, act]`

