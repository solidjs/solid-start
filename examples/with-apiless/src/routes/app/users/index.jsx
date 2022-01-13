import { startTransition, refetchResources } from "solid-js";
import { Link, useData } from "solid-app-router";

export default function Users() {
  const data = useData();

  return (
    <>
      <h2>Users</h2>
      <button onClick={() => startTransition(() => refetchResources())}>Refresh</button>
      <ul>
        <For each={Object.values(data.users() || {})}>
          {({ id, name }) => (
            <li>
              <Link class="list" href={`${id}`}>
                {name}
              </Link>
            </li>
          )}
        </For>
      </ul>
    </>
  );
}
