import { A } from "solid-start";
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
          <img src="data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNjYgMTU1LjMiPjxwYXRoIGQ9Ik0xNjMgMzVTMTEwLTQgNjkgNWwtMyAxYy02IDItMTEgNS0xNCA5bC0yIDMtMTUgMjYgMjYgNWMxMSA3IDI1IDEwIDM4IDdsNDYgOSAxOC0zMHoiIGZpbGw9IiM3NmIzZTEiLz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMjcuNSIgeTE9IjMiIHgyPSIxNTIiIHkyPSI2My41Ij48c3RvcCBvZmZzZXQ9Ii4xIiBzdG9wLWNvbG9yPSIjNzZiM2UxIi8+PHN0b3Agb2Zmc2V0PSIuMyIgc3RvcC1jb2xvcj0iI2RjZjJmZCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzc2YjNlMSIvPjwvbGluZWFyR3JhZGllbnQ+PHBhdGggZD0iTTE2MyAzNVMxMTAtNCA2OSA1bC0zIDFjLTYgMi0xMSA1LTE0IDlsLTIgMy0xNSAyNiAyNiA1YzExIDcgMjUgMTAgMzggN2w0NiA5IDE4LTMweiIgb3BhY2l0eT0iLjMiIGZpbGw9InVybCgjYSkiLz48cGF0aCBkPSJNNTIgMzVsLTQgMWMtMTcgNS0yMiAyMS0xMyAzNSAxMCAxMyAzMSAyMCA0OCAxNWw2Mi0yMVM5MiAyNiA1MiAzNXoiIGZpbGw9IiM1MThhYzgiLz48bGluZWFyR3JhZGllbnQgaWQ9ImIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iOTUuOCIgeTE9IjMyLjYiIHgyPSI3NCIgeTI9IjEwNS4yIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiM3NmIzZTEiLz48c3RvcCBvZmZzZXQ9Ii41IiBzdG9wLWNvbG9yPSIjNDM3N2JiIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMWYzYjc3Ii8+PC9saW5lYXJHcmFkaWVudD48cGF0aCBkPSJNNTIgMzVsLTQgMWMtMTcgNS0yMiAyMS0xMyAzNSAxMCAxMyAzMSAyMCA0OCAxNWw2Mi0yMVM5MiAyNiA1MiAzNXoiIG9wYWNpdHk9Ii4zIiBmaWxsPSJ1cmwoI2IpIi8+PGxpbmVhckdyYWRpZW50IGlkPSJjIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjE4LjQiIHkxPSI2NC4yIiB4Mj0iMTQ0LjMiIHkyPSIxNDkuOCI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjMzE1YWE5Ii8+PHN0b3Agb2Zmc2V0PSIuNSIgc3RvcC1jb2xvcj0iIzUxOGFjOCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzMxNWFhOSIvPjwvbGluZWFyR3JhZGllbnQ+PHBhdGggZD0iTTEzNCA4MGE0NSA0NSAwIDAwLTQ4LTE1TDI0IDg1IDQgMTIwbDExMiAxOSAyMC0zNmM0LTcgMy0xNS0yLTIzeiIgZmlsbD0idXJsKCNjKSIvPjxsaW5lYXJHcmFkaWVudCBpZD0iZCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSI3NS4yIiB5MT0iNzQuNSIgeDI9IjI0LjQiIHkyPSIyNjAuOCI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjNDM3N2JiIi8+PHN0b3Agb2Zmc2V0PSIuNSIgc3RvcC1jb2xvcj0iIzFhMzM2YiIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzFhMzM2YiIvPjwvbGluZWFyR3JhZGllbnQ+PHBhdGggZD0iTTExNCAxMTVhNDUgNDUgMCAwMC00OC0xNUw0IDEyMHM1MyA0MCA5NCAzMGwzLTFjMTctNSAyMy0yMSAxMy0zNHoiIGZpbGw9InVybCgjZCkiLz48L3N2Zz4=" width={48} height={48} alt="solid logo" />
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