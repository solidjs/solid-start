import { A } from "solid-start";
import Poster from "./Poster";

export function Card(props) {
  const media = () =>
    props.item.media_type ? props.item.media_type : props.item.name ? "tv" : "movie";
  return (
    <div class="card">
      <A class="card__link" href={`/${media()}/${props.item.id}`}>
        <div class="card__img">
          <Poster path={props.item.poster_path} alt={props.item.title || props.item.name} loading={props.loading || "eager"} />
        </div>
        <h2>{props.item.title}</h2>
      </A>
    </div>
  );
}
