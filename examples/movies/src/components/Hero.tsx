import { createSignal, Show } from "solid-js";
import { formatRuntime } from "~/utils/format";
import CirclePlayIcon from "~icons/icons/circle-play.svg?inline";
import PlayIcon from "~icons/icons/play.svg?inline";
import styles from "./Hero.module.scss";
import { Modal } from "./Modal";

export function Hero(props) {
  const [modalVisible, setModalVisible] = createSignal(false);

  const stars = () => (props.item.vote_average ? props.item.vote_average * 10 : 0);
  const name = () => (props.item.title ? props.item.title : props.item.name);
  const yearStart = () => {
    const date = props.item.release_date || props.item.first_air_date;
    if (date) {
      return date.split("-")[0];
    }
  };

  const trailer = () => {
    let videos = props.item.videos.results;

    if (!videos.length) {
      return null;
    }

    videos = videos.find(video => video.type === "Trailer");

    if (!videos) {
      return null;
    }

    return [
      {
        name: videos.name,
        src: `https://www.youtube.com/embed/${videos.key}?rel=0&showinfo=0&autoplay=1`
      }
    ];
  };

  const openModal = () => {
    console.log("Open modal");
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <div>
      <div class={styles.hero}>
        <div class={styles.backdrop}>
          <div>
            <Show when={trailer()}>
              <button
                class={styles.play}
                type="button"
                aria-label="Play Trailer"
                onClick={openModal}
              >
                <CirclePlayIcon />
              </button>
            </Show>
            <img
              src={`https://image.tmdb.org/t/p/original${props.item.backdrop_path}`}
              alt=""
              class={styles.image}
              style={{
                height: "100%"
              }}
            />
          </div>
        </div>

        <div class={styles.pane}>
          <div>
            <h1 class={styles.name}>{name()}</h1>
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
            <button
              class={`${styles.trailer} button button--icon `}
              type="button"
              onClick={openModal}
            >
              <span class="icon">
                <PlayIcon />
              </span>
              <span class="txt">Watch Trailer</span>
            </button>
          </div>
          <Show when={modalVisible()}>
            <Modal type="iframe" data={trailer()} onClose={closeModal} />
          </Show>
        </div>
      </div>
    </div>
  );
}

export default Hero;
