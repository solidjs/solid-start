import { A } from "solid-start";
import Poster from "./Poster";

export function Card(props) {
  const media = () =>
    props.item.media_type ? props.item.media_type : props.item.name ? "tv" : "movie";
  return (
    <div class="card">
      <A class="card__link" href={`/${media()}/${props.item.id}`}>
        <div class="card__img">
          <Poster
            // src={"https://image.tmdb.org/t/p/" + props.item.poster_path}
            src={`https://image.tmdb.org/t/p/w370_and_h556_bestv2${props.item.poster_path}`}
            width={370}
            height={556}
          />
        </div>
        <h2>{props.item.title}</h2>
      </A>
    </div>
  );
}
