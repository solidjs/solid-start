import { Show } from "solid-js";
import { A, createRouteData, useRouteData } from "solid-start";
import { getMovie, getMovies, getTrending, getTvShow, getTvShows } from "~/services/tmdbAPI";
import { Hero } from "../../components/Hero";

export function routeData() {
  return createRouteData(async () => {
    try {
      const popular = await getTvShows("popular");
      const topRated = await getTvShows("top_rated");
      const onAir = await getTvShows("on_the_air");
      const airingToday = await getTvShows("airing_today");
      const featured = await getTvShow(popular.results[0].id);

      return {
        popular,
        topRated,
        onAir,
        airingToday,
        featured
      };
    } catch {
      throw new Error("Data not available");
    }
  });
}

export default function Page() {
  const data = useRouteData<typeof routeData>();
  return (
    <main class="main">
      <Show when={data()}>
        <Hero item={data()?.featured} />
      </Show>
      {/* <Show when={trendingMoviesShown}></Show> */}
    </main>
  );
}
