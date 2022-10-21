import { For, Show } from "solid-js";
import { A } from "solid-start";
import styles from "./MovieInfo.module.scss";
export function MovieInfo(props) {
  const directors = () => {
    const people = props.item.credits?.crew;

    if (people) {
      return people.filter(person => person.job === "Director");
    }

    return [];
  };

  return (
    <div class={`spacing ` + styles.info}>
      <div class={styles.left}>
        <div class={styles.poster}>
          <img
            width={370}
            height={556}
            alt="name"
            src={`https://image.tmdb.org/t/p/w370_and_h556_bestv2${props.item.poster_path}`}
          />
          {/* <PlaceholderIcon v-else /> */}
        </div>
      </div>

      <div class={styles.right}>
        <div v-if="props.item.overview" class={styles.overview}>
          <h2 class={styles.title}>Storyline</h2>

          <div>{props.item.overview}</div>
        </div>

        <div class={styles.stats}>
          <ul class="nolist">
            <li v-if="props.item.release_date">
              <div class={styles.label}>Released</div>

              <div class={styles.value}>{props.item.release_date}</div>
            </li>
            <li v-if="props.item.runtime">
              <div class={styles.label}>Runtime</div>

              <div class={styles.value}>{props.item.runtime}</div>
            </li>
            <li v-if="directors">
              <div class={styles.label}>Director</div>

              <div class={styles.value}>
                <For each={directors()}>
                  {(person, i) => (
                    <>
                      <A href={`/person/${person.id}`}>{person.name}</A>
                      {i() < directors().length - 1 ? ", " : ""}
                    </>
                  )}
                </For>
              </div>
            </li>
            <li v-if="props.item.budget">
              <div class={styles.label}>Budget</div>

              <div class={styles.value}>${props.item.budget}</div>
            </li>
            <li v-if="props.item.revenue">
              <div class={styles.label}>Revenue</div>

              <div class={styles.value}>${props.item.revenue}</div>
            </li>
            <li v-if="props.item.genres && props.item.genres.length">
              <div class={styles.label}>Genre</div>

              <div class={styles.value} v-html="formatGenres(props.item.genres)" />
            </li>
            <li v-if="props.item.status">
              <div class={styles.label}>Status</div>

              <div class={styles.value}>{props.item.status}</div>
            </li>
            <li v-if="props.item.original_language">
              <div class={styles.label}>Language</div>

              <div class={styles.value}>{props.item.original_language}</div>
            </li>
            <Show when={props.item.production_companies && props.item.production_companies.length}>
              <li>
                <div class={styles.label}>Production</div>

                <div class={styles.value}>
                  {props.item.production_companies.map(c => c.name).join(", ")}
                </div>
              </li>
            </Show>
          </ul>
        </div>

        <div class={styles.external}>{/* <ExternalLinks links="props.item.external_ids" /> */}</div>
      </div>
    </div>
  );
}
