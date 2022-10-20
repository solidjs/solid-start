import { Show } from "solid-js";
import { createRouteData, useRouteData } from "solid-start";
import { ListingCarousel } from "~/components/ListingCarousel";
import { getListItem, getMovie, getMovies } from "~/services/tmdbAPI";
import { Hero } from "../../../components/Hero";

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
        <ListingCarousel
          items={data()?.popular.results}
          title={getListItem("movie", "popular").TITLE}
          viewAllHref={`/movie/categories/popular`}
        />
        <ListingCarousel
          items={data()?.topRated.results}
          viewAllHref={`/movie/categories/top_rated`}
          title={getListItem("movie", "top_rated").TITLE}
        />
        <ListingCarousel
          items={data()?.upcoming.results}
          title={getListItem("movie", "upcoming").TITLE}
          viewAllHref={`/movie/categories/upcoming`}
        />
        <ListingCarousel
          items={data()?.nowPlaying.results}
          title={getListItem("movie", "now_playing").TITLE}
          viewAllHref={`/movie/categories/now_playing`}
        />
      </Show>
      {/* <Show when={trendingMoviesShown}></Show> */}
    </main>
  );
}
