import { For, Match, Switch } from "solid-js";
import { useRouteData } from "solid-start";
import { createServerAction$, createServerData$ } from "solid-start/server";
import Task from "~/components/Task";
import { xata } from "~/lib/xata";

export function routeData() {
  return createServerData$(() => {
    return xata.db.solid_with_xata_example.getAll()
  })
}

export default function Home() {
  const links = useRouteData<typeof routeData>()

  // Push records action
  const [_, { Form }] = createServerAction$((formData: FormData) =>
    xata.db.solid_with_xata_example.create([
      {
        description: 'Everything you need to know about Xata APIs and tools.',
        title: 'Xata Docs',
        url: 'https://docs.xata.io',
      },
      {
        description: 'In case you need to check some SolidStart specifics.',
        title: 'SolidStart Docs',
        url: 'https://start.solidjs.com/',
      },
      {
        description:
          'Maintain your flow by managing your Xata Workspace without ever leaving VS Code.',
        title: 'Xata VS Code Extension',
        url: 'https://marketplace.visualstudio.com/items?itemName=xata.xata',
      },
      {
        description: 'Get help. Offer help. Show us what you built!',
        title: 'Xata Discord',
        url: 'https://xata.io/discord',
      },
    ])
  )

  return (
    <main>
      <header>
        <img src="/flap.gif" alt="Xata Logo" />
        <h1>
          SolidStart<span aria-hidden>&#8209;</span>Xata
          <span aria-hidden>&#8209;</span>Starter
        </h1>
      </header>
      <article>
        <Switch>
          <Match when={links() && links().length > 0}>
            <ul>
              <For each={links()} >
                {(link) => (
                  <Task {...link} />
                )}
              </For>
            </ul>
          </Match>
          <Match when={links() && links().length === 0}>
            <section>
              <h2>No records found.</h2>
              <strong>
                Create a `solid_with_xata_example` and push some useful links to
                see them here.
              </strong>
              <Form>
                <input type="hidden" name="action" value="create" />
                <button type="submit">Push records to Xata</button>
              </Form>
            </section>
          </Match>
        </Switch>
      </article>
      <footer>
        <span>
          Made by{' '}
          <a href="https://xata.io" rel="noopener noreferrer" target="_blank">
            <object data="/xatafly.svg" aria-label="Xata Logo" />
          </a>
        </span>
      </footer>
    </main>
  );
}
