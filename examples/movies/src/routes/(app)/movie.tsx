import { Show } from "solid-js";
import { A, createRouteData, useRouteData } from "solid-start";
import { getMovie, getMovies, getTrending, getTvShow } from "~/services/tmdbAPI";
import { Hero } from "../../components/Hero";

export function routeData() {
  return createRouteData(async () => {
    try {
      const popular = await getMovies("popular");
      const topRated = await getMovies("top_rated");
      const upcoming = await getMovies("upcoming");
      const nowPlaying = await getMovies("now_playing");
      const featured = await getMovie(upcoming.results[0].id);

      return {
        popular,
        topRated,
        upcoming,
        nowPlaying,
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
