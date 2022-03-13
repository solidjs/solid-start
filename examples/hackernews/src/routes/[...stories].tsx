import { Link, useRouteData, RouteDataFunc } from "solid-app-router";
import { Component, For, Show, createResource } from "solid-js";
import fetchAPI from "~/lib/api";
import Story from "~/components/story";
import { IStory } from "~/types";

const mapStories = {
  top: "news",
  new: "newest",
  show: "show",
  ask: "ask",
  job: "jobs"
} as const;

interface StoriesData {
  page: () => number;
  type: () => string;
  stories: () => IStory[];
}

export const routeData: RouteDataFunc = ({ location, params }) => {
  const page = () => +location.query.page || 1;
  const type = () => params.stories || "top";

  const [stories] = createResource(() => `${mapStories[type()]}?page=${page()}`, fetchAPI);

  return { type, stories, page };
};

const Stories: Component = () => {
  const { page, type, stories } = useRouteData<StoriesData>();
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
