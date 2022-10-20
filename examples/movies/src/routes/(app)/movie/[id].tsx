import { Show } from "solid-js";
import { createRouteData, useRouteData } from "solid-start";
import { Hero } from "~/components/Hero";
import { getMovie } from "~/services/tmdbAPI";

export function routeData({ params }) {
  return createRouteData(
    async id => {
      try {
        const item = await getMovie(id);

        if (item.adult) {
          throw new Error("Data not available");
        } else {
          return { item };
        }
      } catch {
        throw new Error("Data not available");
      }
    },
    {
      key: () => params.id
    }
  );
}

export default function MoviePage() {
  const data = useRouteData<typeof routeData>();

  return (
    <main>
      <Show when={data()}>
        <Hero item={data()?.item} />
      </Show>
    </main>
  );
}
