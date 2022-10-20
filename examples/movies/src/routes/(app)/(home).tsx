import { Show } from "solid-js";
import { A, createRouteData, useRouteData } from "solid-start";
import { getMovie, getTrending, getTvShow } from "~/services/tmdbAPI";
import { Hero } from "../../components/Hero";

export function routeData() {
  return createRouteData(async () => {
    try {
      const trendingMovies = await getTrending("movie");
      const trendingTv = await getTrending("tv");
      let featured;

      // feature a random item from movies or tv
      const items = [...trendingMovies.results, ...trendingTv.results];
      const randomItem = items[Math.floor(Math.random() * items.length)];
      const media = randomItem.title ? "movie" : "tv";

      if (media === "movie") {
        featured = await getMovie(randomItem.id);
      } else {
        featured = await getTvShow(randomItem.id);
      }

      console.log(featured);

      return {
        trendingMovies,
        trendingTv,
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
