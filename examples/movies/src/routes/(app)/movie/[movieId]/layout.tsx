import { Show } from "solid-js";
import { A, Outlet, useParams, useRouteData } from "solid-start";
import { Hero } from "~/components/Hero";
import { routeData } from "../[movieId]";
import styles from "./layout.module.scss";

export function MoviePage() {
  const data = useRouteData<typeof routeData>();

  return (
    <main>
      <Show when={data()}>
        <Hero item={data()?.item} />
      </Show>
      <div class={styles.nav}>
        <A
          href={`/movie/${useParams().movieId}`}
          activeClass={styles.buttonActive}
          class={styles.button}
        >
          Overview
        </A>
        <A
          href={`/movie/${useParams().movieId}/videos`}
          activeClass={styles.buttonActive}
          class={styles.button}
        >
          Videos
        </A>
        <A
          href={`/movie/${useParams().movieId}/photos`}
          activeClass={styles.buttonActive}
          class={styles.button}
        >
          Photos
        </A>
      </div>
      <Outlet />
    </main>
  );
}
