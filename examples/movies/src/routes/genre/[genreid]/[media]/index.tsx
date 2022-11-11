import { Show } from "solid-js";
import { createRouteData, useParams, useRouteData } from "solid-start";
import { getGenreList, getMediaByGenre } from "~/services/tmdbAPI";
import { Images } from "./Images";

export function routeData({ params }) {
  return createRouteData(
    async () => {
      try {
        if (!["movie", "tv"].includes(params.media))
          throw new Error("This kind of media does not exist");
        const genreList = await getGenreList(params.media);
        if (!genreList) throw new Error("Genre list not available");
        const name = genreList.find(genre => genre.id === +params.genreid)?.name;
        if (!name) throw new Error("This genre does not exist");
        return {
          name
        };
      } catch (e) {
        throw new Error("Data not available");
      }
    },
    {
      key: () => params.genreid
    }
  );
}

export default function Page() {
  const params = useParams();
  const data = useRouteData<typeof routeData>();
  return (
    <main>
      <Show when={data()}>
        <Images genreid={+params.genreid} title={data().name} media={params.media} />
      </Show>
    </main>
  );
}
