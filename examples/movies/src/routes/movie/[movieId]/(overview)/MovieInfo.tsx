import { For, Show } from "solid-js";
import { A } from "solid-start";
import { ExternalLinks } from "~/components/ExternalLinks";
import Poster from "~/components/Poster";
import { formatCurrency, formatDate, formatLanguage, formatRuntime } from "~/utils/format";
import styles from "./MovieInfo.module.scss";

export function MovieInfo(props) {
  const directors = () => {
    const people = props.item.credits?.crew;

    if (people) {
      return people.filter(person => person.job === "Director");
    }

    return [];
  };

  const links = () => {
    const externalIds = props.item.external_ids;
    const homepage = props.item.homepage;
    return homepage
      ? {
          ...externalIds,
          homepage
        }
      : externalIds;
  };

  return (
    <div class={`spacing ` + styles.info}>
      <div class={styles.left}>
        <div class={styles.poster}>
          <Poster
            width={370}
            height={556}
            alt="name"
            src={`https://image.tmdb.org/t/p/w370_and_h556_bestv2${props.item.poster_path}`}
          />
          {/* <PlaceholderIcon v-else /> */}
        </div>
      </div>

      <div class={styles.right}>
        <Show when={props.item.overview}>
          <div class={styles.overview}>
            <h2 class={styles.title}>Storyline</h2>

            <div>{props.item.overview}</div>
          </div>
        </Show>
        <div class={styles.stats}>
          <ul class="nolist">
            <Show when={props.item.release_date}>
              <li>
                <div class={styles.label}>Released</div>

                <div class={styles.value}>{formatDate(props.item.release_date)}</div>
              </li>
            </Show>
            <Show when={props.item.runtime}>
              <li>
                <div class={styles.label}>Runtime</div>

                <div class={styles.value}>{formatRuntime(props.item.runtime)}</div>
              </li>
            </Show>
            <Show when={directors()}>
              <li>
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
            </Show>
            <Show when={props.item.budget}>
              <li>
                <div class={styles.label}>Budget</div>

                <div class={styles.value}>{formatCurrency(props.item.budget)}</div>
              </li>
            </Show>
            <Show when={props.item.revenue}>
              <li>
                <div class={styles.label}>Revenue</div>

                <div class={styles.value}>{formatCurrency(props.item.revenue)}</div>
              </li>
            </Show>
            <Show when={props.item.genres && props.item.genres.length}>
              <li>
                <div class={styles.label}>Genre</div>

                <div class={styles.value}>
                  <For each={props.item.genres}>
                    {(genre, i) => (
                      <>
                        <A href={`/genre/${genre.id}`}>{genre.name}</A>
                        {i() < props.item.genres.length - 1 ? ", " : ""}
                      </>
                    )}
                  </For>
                </div>
              </li>
            </Show>
            <Show when={props.item.status}>
              <li>
                <div class={styles.label}>Status</div>

                <div class={styles.value}>{props.item.status}</div>
              </li>
            </Show>
            <Show when={props.item.original_language}>
              <li>
                <div class={styles.label}>Language</div>

                <div class={styles.value}>{formatLanguage(props.item.original_language)}</div>
              </li>
            </Show>
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

        <div class={styles.external}>{<ExternalLinks links={links()} />}</div>
      </div>
    </div>
  );
}
