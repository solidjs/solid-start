import { For } from "solid-js";
import "./Images.scss";

export default function ImagesSection(props) {
  return (
    <div class="spacing">
      <div class="images__head">
        <h2 class="images__title">{props.title}</h2>
        <strong class="images__count"> {props.images?.length} Images </strong>
      </div>
      <div class="images__items">
        <For each={props.images as any[]}>
          {image => <ImagesItem type={props.title.toLowerCase()} image={image} />}
        </For>
      </div>
    </div>
  );
}

function ImagesItem(props) {
  const thumbWidth = props.type === "posters" ? 370 : 533;
  const thumbHeight = props.type === "posters" ? 556 : 300;

  return (
    <div class={`images-item images-${props.type}`}>
      <div class="images-item__img">
        <img
          // loading="lazy"
          width={thumbWidth}
          height={thumbHeight}
          // sizes="xsmall:29vw small:29vw medium:17vw large:14vw xlarge:13vw xlarge1:11vw xlarge2:12vw xlarge3:342"
          src={`https://image.tmdb.org/t/p/w${thumbWidth}_and_h${thumbHeight}_bestv2${props.image
            .file_path!}`}
          style={{ "aspect-ratio": props.image.aspect_ratio }}
        />
      </div>
    </div>
  );
}
