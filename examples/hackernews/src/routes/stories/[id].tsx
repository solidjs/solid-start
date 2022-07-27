import { RouteDataFunc } from "solid-app-router";
import { Component, createResource, For, Show } from "solid-js";
import { useRouteData } from "solid-start";
import Comment from "~/components/comment";
import fetchAPI from "~/lib/api";
import type { IStory } from "~/types";

export const routeData: RouteDataFunc = props => {
  const [story] = createResource(() => `item/${props.params.id}`, fetchAPI);
  return story;
};

const Story: Component = () => {
  const story = useRouteData<() => IStory>();
  return (
    <Show when={story()}>
      {s => (
        console.log(s),
        (
          <div class="item-view">
            <div class="item-view-header">
              <a href={story().url} target="_blank">
                <h1>{story().title}</h1>
              </a>
              <Show when={story().domain}>
                <span class="host">({story().domain})</span>
              </Show>
              <p class="meta">
                {story().points} points | by <a href={`/users/${story().user}`}>{story().user}</a>{" "}
                {story().time_ago} ago
              </p>
            </div>
            <div class="item-view-comments">
              <p class="item-view-comments-header">
                {story().comments_count ? story().comments_count + " comments" : "No comments yet."}
              </p>
              <ul class="comment-children">
                <For each={story().comments}>{comment => <Comment comment={comment} />}</For>
              </ul>
            </div>
          </div>
        )
      )}
    </Show>
  );
};

export default Story;
