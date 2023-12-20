import { A, Outlet } from "solid-start";
import GitHubIcon from "~icons/ant-design/github-filled";
import EmailIcon from "~icons/ant-design/mail-filled";
import TwitterIcon from "~icons/ant-design/twitter-outlined";
import styles from "./Footer.module.scss";

export default function Footer() {
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
            href="https://twitter.com/solidjs"
            target="_blank"
            aria-label="Link to Twitter account"
            rel="noopener"
          >
            <TwitterIcon width={24} height={24} />
          </a>
        </li>
        <li>
          <a
            href="https://github.com/solidjs/solid-start/tree/movies/examples/movies"
            target="_blank"
            aria-label="Link to GitHub account"
            rel="noopener"
          >
            <GitHubIcon width={24} height={24} />
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