import { Show } from "solid-js";
import { useRouteData } from "solid-start";
import type { routeData } from "../layout";
import { Credits } from "./Credits";
import { MovieInfo } from "./MovieInfo";

export default function MoviePage() {
  const data = useRouteData<typeof routeData>();

  return (
    <Show when={data()}>
      <MovieInfo item={data()?.item} />
      <Show when={data()?.item?.credits?.cast?.length}>
        <Credits people={data()?.item?.credits?.cast} />
      </Show>
    </Show>
  );
}
