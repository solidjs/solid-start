import { Show } from "solid-js";
import { ExternalLinks } from "./ExternalLinks";
import styles from "./PersonInfo.module.scss";

function formatContent(content: string) {
  return content
    .split("\n")
    .filter(section => section !== "")
    .map(section => `<p>${section}</p>`)
    .join("");
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-us", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function calculateAge(birthday: string, deathday?: string) {
  const cutoffDate = deathday ? Number(new Date(deathday)) : Date.now();
  const ageDifMs = cutoffDate - Number(new Date(birthday));
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export function PersonInfo(props) {
  return (
    <div class={`spacing ${styles.info}`}>
      <div class={styles.left}>
        <div class={styles.poster}>
          <Show when={props.person.profile_path}>
            <img
              src={"https://image.tmdb.org/t/p/w370_and_h556_bestv2" + props.person.profile_path}
              alt={props.person.name}
            />
          </Show>
        </div>
      </div>

      <div class={styles.right}>
        <div class={styles.overview}>
          <h2 class={styles.title}>{props.person.name}</h2>

          <Show when={props.person.biography}>
            <Show when={props.person.profile_path}>
              <img
                src={"https://image.tmdb.org/t/p/w370_and_h556_bestv2" + props.person.profile_path}
                alt={props.person.name}
              />
            </Show>
            <div innerHTML={formatContent(props.person.biography)} />
          </Show>
        </div>

        <div class={styles.stats}>
          <ul class="nolist">
            <Show when={props.person.known_for_department}>
              <li>
                <div class={styles.label}>Known For</div>
                <div class={styles.value}>{props.person.known_for_department}</div>
              </li>
            </Show>

            <Show when={props.person.birthday}>
              <li>
                <div class={styles.label}>Born</div>
                <div class={styles.value}>
                  {formatDate(props.person.birthday)}{" "}
                  <Show when={!props.person.deathday}>
                    (age {calculateAge(props.person.birthday)})
                  </Show>
                </div>
              </li>
            </Show>

            <Show when={props.person.place_of_birth}>
              <li>
                <div class={styles.label}>Place of Birth</div>
                <div class={styles.value}>{props.person.place_of_birth}</div>
              </li>
            </Show>

            <Show when={props.person.deathday}>
              <li>
                <div class={styles.label}>Died</div>
                <div class={styles.value}>
                  {formatDate(props.person.deathday)}{" "}
                  <Show when={props.person.birthday}>
                    (age {calculateAge(props.person.birthday, props.person.deathday)})
                  </Show>
                </div>
              </li>
            </Show>
          </ul>
        </div>

        <div class={styles.external}>
          <ExternalLinks media="person" links={props.person.external_ids} />
        </div>
      </div>
    </div>
  );
}
