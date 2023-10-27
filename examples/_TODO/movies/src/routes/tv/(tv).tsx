import { Show } from "solid-js";
import { createRouteData, useRouteData } from "solid-start";
import { Hero } from "~/components/Hero";
import { ListingCarousel } from "~/components/ListingCarousel";
import { getListItem, getTvShow, getTvShows } from "~/services/tmdbAPI";

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
      <ListingCarousel
        items={data()?.popular.results}
        title={getListItem("tv", "popular").TITLE}
        viewAllHref={`/tv/categories/popular`}
      />
      <ListingCarousel
        items={data()?.topRated.results}
        viewAllHref={`/tv/categories/top_rated`}
        title={getListItem("tv", "top_rated").TITLE}
      />
      <ListingCarousel
        items={data()?.onAir.results}
        title={getListItem("tv", "on_the_air").TITLE}
        viewAllHref={`/tv/categories/on_the_air`}
      />
      <ListingCarousel
        items={data()?.airingToday.results}
        title={getListItem("tv", "airing_today").TITLE}
        viewAllHref={`/tv/categories/airing_today`}
      />
      {/* <Show when={trendingMoviesShown}></Show> */}
    </main>
  );
}
