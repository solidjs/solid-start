import { Icon } from "solid-heroicons";
import { Show } from "solid-js";
import { A, createRouteData, useRouteData } from "solid-start";
import { Outlet } from "solid-start";
import { getMovie, getTrending, getTvShow } from "~/services/tmdbAPI";
import GitHubIcon from "~icons/ant-design/github-filled";
import EmailIcon from "~icons/ant-design/mail-filled";
import LinkedInIcon from "~icons/ant-design/linkedin-filled";
import TwitterIcon from "~icons/ant-design/twitter-outlined";
import MagnifierIcon from "~icons/ant-design/search-outlined";
import HomeIcon from "~icons/ant-design/home-outlined";
import MoviesIcon from "~icons/pepicons/clapperboard";
import TVIcon from "~icons/pepicons/television";
import * as styles from "./(app).module.scss";
import "./(app).scss";

export default function Page() {
  return (
    <div>
      <TheNav />
      <Outlet />
      <TheFooter />
    </div>
  );
}

function TheFooter() {
  return (
    <footer class={styles.footer}>
      <p>
        &copy; {new Date().getFullYear()} The Nuxt Movies authors. All rights reserved.&nbsp;
        <a target="_blank" href="https://jason.codes/cookie-policy" rel="noopener">
          Cookie Policy
        </a>
        .
      </p>
      <p>
        Designed by the Nuxt Movies authors, and ported by the Solid Movies authors, with the
        original data provided by&nbsp;
        <a target="_blank" href="https://www.themoviedb.org/" rel="noopener">
          TMDb
        </a>
        .
      </p>

      <ul class="nolist">
        <li>
          <a
            href="https://twitter.com/jasonujmaalvis"
            target="_blank"
            aria-label="Link to Twitter account"
            rel="noopener"
          >
            <TwitterIcon width={24} height={24} />
          </a>
        </li>
        <li>
          <a
            href="https://github.com/addyosmani/nuxt-movies"
            target="_blank"
            aria-label="Link to GitHub account"
            rel="noopener"
          >
            <GitHubIcon width={24} height={24} />
          </a>
        </li>
        <li>
          <a
            href="https://www.linkedin.com/in/jason-ujma-alvis"
            target="_blank"
            aria-label="Link to LinkedIn account"
            rel="noopener"
          >
            <LinkedInIcon width={24} height={24} />
          </a>
        </li>
        <li>
          <a href="mailto:hello@jason.codes" aria-label="Link to Email" rel="noopener">
            <EmailIcon width={24} height={24} />
          </a>
        </li>
      </ul>
    </footer>
  );
}
export function TheNav() {
  return (
    <nav class={styles.nav}>
      <ul class="nolist">
        <li>
          <A href="/" end aria-label="Home">
            <HomeIcon width={24} height={24} color="white" />
          </A>
        </li>
        <li>
          <A href="/movie" aria-label="Movies">
            <MoviesIcon width={24} height={24} color="white" />
          </A>
        </li>
        <li>
          <A href="/tv" aria-label="TV Shows">
            <TVIcon width={24} height={24} color="white" />
          </A>
        </li>
        <li>
          <button class="search-toggle" type="button" aria-label="Search" aria-haspopup="true">
            <MagnifierIcon width={24} height={24} color="white" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
