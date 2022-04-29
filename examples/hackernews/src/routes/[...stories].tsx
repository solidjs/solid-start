import { Link, useRouteData, RouteDataFunc, useLocation, useParams } from "solid-app-router";
import { Component, For, Show, createResource } from "solid-js";
import fetchAPI from "~/lib/api";
import Story from "~/components/story";
import { IStory } from "~/types";
import { createRouteResource } from "solid-start/router";

const mapStories = {
  top: "news",
  new: "newest",
  show: "show",
  ask: "ask",
  job: "jobs"
} as const;

const Stories: Component = () => {
  const [stories] = createRouteResource<IStory[], string>(({ location, params }) => {
    const page = () => +location.query.page || 1;
    const type = () => params.stories || "top";

    return `${mapStories[type()]}?page=${page()}`;
  }, fetchAPI);

  const location = useLocation();
  const params = useParams();
  const page = () => +location.query.page || 1;
  const type = () => params.stories || "top";
  return (
    <div class="news-view">
      <div class="news-list-nav">
        <Show
          when={page() > 1}
          fallback={
            <span class="page-link disabled" aria-disabled="true">
              {"<"} prev
            </span>
          }
        >
          <Link class="page-link" href={`/${type()}?page=${page() - 1}`} aria-label="Previous Page">
            {"<"} prev
          </Link>
        </Show>
        <span>page {page()}</span>
        <Show
          when={stories() && stories().length >= 29}
          fallback={
            <span class="page-link disabled" aria-disabled="true">
              more {">"}
            </span>
          }
        >
          <Link class="page-link" href={`/${type()}?page=${page() + 1}`} aria-label="Next Page">
            more {">"}
          </Link>
        </Show>
      </div>
      <main class="news-list">
        <Show when={stories()}>
          <ul>
            <For each={stories()}>{story => <Story story={story} />}</For>
          </ul>
        </Show>
      </main>
    </div>
  );
};

export default Stories;
