import { useData } from "solid-app-router";
import { createResource, ErrorBoundary, Show } from "solid-js";
import server from "solid-start/server";
import { JokeDisplay } from "~/components/joke";
import { db } from "~/utils/db.server";
import { Meta, Title } from "solid-meta";
// import { JokeDisplay } from "~/components/joke";

// export const meta: MetaFunction = ({
//   data,
// }: {
//   data: LoaderData | undefined;
// }) => {
//   if (!data) {
//     return {
//       title: "No joke",
//       description: "No joke found",
//     };
//   }
//   return {
//     title: `"${data.joke.name}" joke`,
//     description: `Enjoy the "${data.joke.name}" joke and much more`,
//   };
// };

// type LoaderData = { joke: Joke; isOwner: boolean };

export const routeData = ({ params }) =>
  createResource(
    () => [params.jokeId],
    async ([jokeId]) => {
      try {
        return await server(async (jokeId) => {
          // const userId = await getUserId(request);
          const joke = await db.joke.findUnique({ where: { id: jokeId } });
          if (!joke) {
            throw new Response("What a joke! Not found.", { status: 404 });
          }
          const data = { joke, isOwner: true };
          return data;
        })(jokeId);
      } catch (e) {
        console.log("DATA", e);
        throw new Error('"What a joke! Not found."');
      }
    }
  );

function JokeData() {
  const [data] = useData<ReturnType<typeof routeData>>();

  return (
    <Show when={data()}>
      <Title>{data().joke.name}</Title>
      <JokeDisplay joke={data().joke} isOwner={data().isOwner} />
    </Show>
  );
}
export default function JokeRoute() {
  return <JokeData />;
}

// export function ErrorBoundary(props: { error: Error }) {
//   console.log("hereee erro fn");
//   return <div>Something unexpected went wrong. Sorry about that.</div>;
// }

// export function CatchBoundary() {
//   const caught = useCatch();
//   const params = useParams();
//   switch (caught.status) {
//     case 404: {
//       return (
//         <div className="error-container">
//           Huh? What the heck is {params.jokeId}?
//         </div>
//       );
//     }
//     case 401: {
//       return (
//         <div className="error-container">
//           Sorry, but {params.jokeId} is not your joke.
//         </div>
//       );
//     }
//     default: {
//       throw new Error(`Unhandled error: ${caught.status}`);
//     }
//   }
// }

// export function ErrorBoundary({ error }: { error: Error }) {
//   console.error(error);
//   const { jokeId } = useParams();
//   return (
//     <div>{`There was an error loading joke by the id ${jokeId}. Sorry.`}</div>
//   );
// }
