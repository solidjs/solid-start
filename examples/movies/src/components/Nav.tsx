import { A, Outlet } from "solid-start";
import HomeIcon from "~icons/ant-design/home-outlined";
import MagnifierIcon from "~icons/ant-design/search-outlined";
import MoviesIcon from "~icons/pepicons/clapperboard";
import TVIcon from "~icons/pepicons/television";
import styles from "./Nav.module.scss";

export default function Nav() {
  return (
    <nav class={styles.nav}>
      <ul class="nolist">
        <li class={styles.logo}>
          <img src="/solidjs.svg" width={48} height={48} alt="solid logo" />
        </li>
        <li>
          <A href="/" end aria-label="Home">
            <HomeIcon width={24} height={24} />
          </A>
        </li>
        <li>
          <A href="/movie" aria-label="Movies">
            <MoviesIcon width={24} height={24} />
          </A>
        </li>
        <li>
          <A href="/tv" aria-label="TV Shows">
            <TVIcon width={24} height={24} />
          </A>
        </li>
        <li>
          <A href="/search" aria-label="Search">
            <MagnifierIcon width={24} height={24} />
          </A>
        </li>
      </ul>
    </nav>
  );
}