import { Component, createResource, For, Show } from "solid-js";
import { A, RouteDataArgs, useRouteData } from "solid-start";
import Comment from "~/components/comment";
import fetchAPI from "~/lib/api";
import { IStory } from "~/types";

export const routeData = (props: RouteDataArgs) => {
  const [story] = createResource<IStory, string>(() => `item/${props.params.id}`, fetchAPI);
  return story;
};

const Story: Component = () => {
  const story = useRouteData<typeof routeData>();
  return (
    <Show when={story()}>
      <div class="item-view">
        <div class="item-view-header">
          <a href={story()!.url} target="_blank">
            <h1>{story()!.title}</h1>
          </a>
          <Show when={story()!.domain}>
            <span class="host">({story()!.domain})</span>
          </Show>
          <p class="meta">
            {story()!.points} points | by <A href={`/users/${story()!.user}`}>{story()!.user}</A>{" "}
            {story()!.time_ago} ago
          </p>
        </div>
        <div class="item-view-comments">
          <p class="item-view-comments-header">
            {story()!.comments_count ? story()!.comments_count + " comments" : "No comments yet."}
          </p>
          <ul class="comment-children">
            <For each={story()!.comments}>{comment => <Comment comment={comment} />}</For>
          </ul>
        </div>
      </div>
    </Show>
  );
};

export default Story;
