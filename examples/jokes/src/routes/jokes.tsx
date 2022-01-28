// import { Form } from "remix";
// import { Outlet, useLoaderData, Link } from "remix";
import { db } from "~/utils/db.server";

import "../styles/jokes.css";
import { Link, Outlet, useData } from "solid-app-router";
import { createResource, For, Show } from "solid-js";
import server from "solid-start/server";
import { getUser, logout } from "~/utils/session.server";
import { createForm } from "solid-start/form";

export const routeData = () => {
  const d = createResource(
    server(async () => {
      const jokeListItems = await db.joke.findMany({
        take: 5,
        select: { id: true, name: true },
        orderBy: { createdAt: "desc" },
      });
      const user = await getUser(server.getContext().request);
      return { user: user, jokeListItems };
    })
  );
  console.log(d);
  return d;
};

// export const links: LinksFunction = () => {
//   return [{ rel: "stylesheet", href: stylesUrl }];
// };

// function useRouteData<T extends (...args: any) => any>() {
//   return useData<ReturnType<T>>();
// }

const LogoutForm = createForm(
  server(async (form: FormData) => {
    await logout(server.getContext().request);
  })
);

export default function JokesScreen() {
  const [data] = useData<ReturnType<typeof routeData>>();
  console.log(data);

  return (
    <div class="jokes-layout">
      <header class="jokes-header">
        <div class="container">
          <h1 class="home-link">
            <Link href="/" title="Remix Jokes" aria-label="Remix Jokes">
              <span class="logo">🤪</span>
              <span class="logo-medium">J🤪KES</span>
            </Link>
          </h1>
          <Show when={data()?.user} fallback={<Link href="/login">Login</Link>}>
            <div class="user-info">
              <span>{`Hi ${data().user.username}`}</span>
              <LogoutForm method="post">
                <button type="submit" class="button">
                  Logout
                </button>
              </LogoutForm>
            </div>
          </Show>
        </div>
      </header>
      <main class="jokes-main">
        <div class="container">
          <div class="jokes-list">
            <Show when={data()?.jokeListItems.length}>
              <>
                <Link href=".">Get a random joke</Link>
                <p>Here are a few more jokes to check out:</p>
                <ul>
                  <For each={data().jokeListItems}>
                    {({ id, name }) => (
                      <li>
                        <Link href={id}>{name}</Link>
                      </li>
                    )}
                  </For>
                </ul>
                <Link href="new" class="button">
                  Add your own
                </Link>
              </>
            </Show>
          </div>
          <div class="jokes-outlet">
            <Outlet />
          </div>
        </div>
      </main>
      <footer class="jokes-footer">
        <div class="container">
          {/* <Link reloadDocument to="/jokes.rss">
            RSS
          </Link> */}
        </div>
      </footer>
    </div>
  );
}
