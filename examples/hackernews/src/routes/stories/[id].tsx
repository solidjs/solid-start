import { Link } from "solid-app-router";
import { Component, For, Show } from "solid-js";
import type { IStory } from "~/types";
import Comment from "~/components/comment";
import fetchAPI from "~/lib/api";
import { createRouteResource } from "solid-start/router";

const Story: Component = () => {
  const [story] = createRouteResource<IStory, string>(
    ({ params }) => `item/${params.id}`,
    fetchAPI
  );

  return (
    <Show when={story()}>
      <div class="item-view">
        <div class="item-view-header">
          <a href={story().url} target="_blank">
            <h1>{story().title}</h1>
          </a>
          <Show when={story().domain}>
            <span class="host">({story().domain})</span>
          </Show>
          <p class="meta">
            {story().points} points | by <Link href={`/users/${story().user}`}>{story().user}</Link>{" "}
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
    </Show>
  );
};

export default Story;
