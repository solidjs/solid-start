import { Show } from "solid-js";
import { formatRuntime } from "~/utils/format";
import styles from "./Hero.module.scss";

export function Hero(props) {
  const stars = () => (props.item.vote_average ? props.item.vote_average * 10 : 0);
  const name = () => (props.item.title ? props.item.title : props.item.name);
  const yearStart = () => {
    const date = props.item.release_date || props.item.first_air_date;
    if (date) {
      return date.split("-")[0];
    }
  };

  return (
    <div>
      <div class={styles.hero}>
        <div class={styles.backdrop}>
          <div>
            <Show when={props.trailer}>
              <button
                class={styles.play}
                type="button"
                aria-label="Play Trailer"
                onClick="openModal"
              >
                {/* <CirclePlayIcon /> */}
              </button>
            </Show>
            <img
              // src={"https://image.tmdb.org/t/p/original" + props.item.backdrop_path}
              src={`https://image.tmdb.org/t/p/w1920_and_h800_multi_faces${props.item.backdrop_path}`}
              alt=""
              class={styles.image}
              style={{
                height: "100%"
              }}
            />
            {/* <nuxt-picture
        class="$style.image"
        sizes="xsmall:100vw medium:71.1vw"
        :alt="name"
        :src="backdrop" /> */}
          </div>
        </div>

        <div class={styles.pane}>
          <div>
            <h1 class={styles.name}>
              {name()}

              {/* <template >
          <A to="{ name: `${type}-id`, params: { id: item.id } }">
            { props.item.name }
          </A>
        </template> */}
            </h1>
            <div class={styles.meta}>
              <div class={styles.rating}>
                <Show when={stars()}>
                  <div class={styles.stars}>
                    <div style={{ width: `${stars()}%` }} />
                  </div>
                </Show>

                <Show when={props.item.vote_count > 0}>
                  <div>{props.item.vote_count} Reviews</div>
                </Show>
              </div>

              <div class={styles.info}>
                <Show when={props.item.number_of_seasons}>
                  <span>Season {props.item.number_of_seasons}</span>
                </Show>
                <Show when={yearStart()}>
                  <span>{yearStart()}</span>
                </Show>
                <Show when={props.item.runtime}>
                  <span>{formatRuntime(props.item.runtime)}</span>
                </Show>
                {/* <span>Cert. {{ cert }}</span> */}
              </div>
            </div>
            <div class={styles.desc}>{props.item.overview}</div>
          </div>
          {/* <transition
        appear
        name="hero">
        <div>
          <h1 class="$style.name">
            <template>
              {{ name }}
            </template>

            <template >
              <nuxt-link :to="{ name: `${type}-id`, params: { id: item.id } }">
                {{ name }}
              </nuxt-link>
            </template>
          </h1>

          <div class="$style.meta">
            <div

              class="$style.rating">
              <div

                class="$style.stars">
                <div :style="{ width: `${stars}%` }" />
              </div>

              <div>
                {{ item.vote_count | numberWithCommas }} Reviews
              </div>
            </div>

            <div class="$style.info">
              <span >Season {{ item.number_of_seasons }}</span>
              <span>{{ yearStart }}</span>
              <span >{{ item.runtime | runtime }}</span>
              <span>Cert. {{ cert }}</span>
            </div>
          </div>

          <div class="$style.desc">
            {{ item.overview | truncate(200) }}
          </div>

          <button
            class="button button--icon"
            class="$style.trailer"
            type="button"
            onClick="openModal">
            <PlayIcon class="icon" />
            <span class="txt">Watch Trailer</span>
          </button>
        </div> */}
        </div>
      </div>
    </div>
  );
}

export default Hero;
