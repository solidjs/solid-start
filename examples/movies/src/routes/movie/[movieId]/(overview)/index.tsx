import { Show } from "solid-js";
import { useParams } from "solid-start";
import { useMovie } from "../useMovie";
import { Credits } from "./Credits";
import { MovieInfo } from "./MovieInfo";

export default function MoviePage() {
  const params = useParams();
  const data = useMovie(params);
  return (
    <Show when={data()}>
      <MovieInfo item={data()?.item} />
      <Show when={data()?.item?.credits?.cast?.length}>
        <Credits people={data()?.item?.credits?.cast} />
      </Show>
    </Show>
  );
}
