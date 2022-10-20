import { A } from "solid-start";

export function Card(props) {
  const media = () =>
    props.item.media_type ? props.item.media_type : props.item.name ? "tv" : "movie";
  return (
    <div class="card">
      <A class="card__link" href={`/${media()}/${props.item.id}`}>
        <div class="card__img">
          <img
            src={"https://image.tmdb.org/t/p/original" + props.item.poster_path}
            width={370}
            height={556}
          />
        </div>
        <h2>{props.item.title}</h2>
      </A>
    </div>
  );
}
