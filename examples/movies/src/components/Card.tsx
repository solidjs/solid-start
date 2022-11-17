import { Show } from "solid-js";
import { A } from "solid-start";
import Poster from "./Poster";

export function Card(props) {
  const media = () =>
    props.item.media_type ? props.item.media_type : props.item.name ? "tv" : "movie";
  const stars = () => (props.item.vote_average ? props.item.vote_average * 10 : 0);
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
        <h2 class="card__name">{props.item.title}</h2>
        <Show
          when={props.item.media_type !== "person" && (props.item.stars || props.item.vote_average)}
        >
          <div class="card__rating">
            <div class="card__stars">
              <div style={{ width: `${stars()}%` }} />
            </div>

            <div class="card__vote">{props.item.vote_average || props.item.rating}</div>
          </div>
        </Show>
      </A>
    </div>
  );
}
