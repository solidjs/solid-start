import { A } from "solid-start";
import "./CreditItems.scss";

export function CreditsItem(props) {
  return (
    <div class="credits-item">
      <A class="credits-item__link" href={`/person/${props.person.id}`}>
        <div class="credits-item__img">
          <img
            loading="lazy"
            width="370"
            height="556"
            sizes="xsmall:29vw small:29vw medium:17vw large:14vw xlarge:13vw xlarge1:11vw xlarge2:12vw xlarge3:342"
            alt={props.person.name}
            src={`https://image.tmdb.org/t/p/w370_and_h556_bestv2${props.person.profile_path}`}
          />
          {/* <PlaceholderIcon v-else /> */}
        </div>

        <h2 class="credits-item__name">{props.person.name}</h2>

        <div class="credits-item__character">{props.person.character}</div>
      </A>
    </div>
  );
}
