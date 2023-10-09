import { For } from "solid-js";
import { A, createRouteData, useParams, useRouteData } from "solid-start";
import { Card } from "~/components/Card";
import { getListItem, getTrending, getTvShows } from "~/services/tmdbAPI";

export function routeData({ params }) {
  return createRouteData(
    async name => {
      try {
        const items = name === "trending" ? await getTrending("tv") : await getTvShows(name);
        return { items };
      } catch {
        throw new Error("Data not available");
      }
    },
    {
      key: () => params.name
    }
  );
}
export default function MovieCategories() {
  const data = useRouteData<typeof routeData>();
  const params = useParams();

  return (
    <main class="main">
      <div class="listing">
        <div class="listing__head">
          <h2 class="listing__title">{getListItem("tv", params.name).TITLE}</h2>
          <A href="viewAllUrl" class="listing__explore">
            <strong>Explore All</strong>
          </A>
        </div>
        <div class="listing__items">
          <For each={data()?.items.results}>{item => <Card item={item} />}</For>
        </div>
      </div>
    </main>
  );
}
