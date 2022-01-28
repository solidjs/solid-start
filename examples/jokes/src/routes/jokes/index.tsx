import { Link, useData } from "solid-app-router";
import { createResource, Show } from "solid-js";
import server from "solid-start/server";
import { db } from "~/utils/db.server";

export const routeData = () =>
  createResource(
    server(async () => {
      const count = await db.joke.count();
      const randomRowNumber = Math.floor(Math.random() * count);
      const [randomJoke] = await db.joke.findMany({
        take: 1,
        skip: randomRowNumber,
      });
      if (!randomJoke) {
        throw new Response("No jokes to be found!", { status: 404 });
      }
      const data = { randomJoke };
      return data;
    })
  );

export default function JokesIndexRoute() {
  const [data] = useData<ReturnType<typeof routeData>>();

  return (
    <Show when={data()}>
      {(data) => (
        <div>
          <p>Here's a random joke:</p>
          <p>{data.randomJoke.content}</p>
          <Link href={data.randomJoke.id}>
            "{data.randomJoke.name}" Permalink
          </Link>
        </div>
      )}
    </Show>
  );
}

// export function CatchBoundary() {
//   const caught = useCatch();

//   if (caught.status === 404) {
//     return (
//       <div className="error-container">
//         <p>There are no jokes to display.</p>
//         <Link to="new">Add your own</Link>
//       </div>
//     );
//   }
//   throw new Error(`Unexpected caught response with status: ${caught.status}`);
// }

// export function ErrorBoundary({ error }: { error: Error }) {
//   console.error(error);
//   return <div>I did a whoopsies.</div>;
// }
