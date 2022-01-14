import { Link } from "solid-app-router";
import { Component, Show } from "solid-js";

import type { IStory } from "../types";

const Story: Component<{ story: IStory }> = (props) => {
  return (
    <li class="news-item">
      <span class="score">{props.story.points}</span>
      <span class="title">
        <Show
          when={props.story.url}
          fallback={<Link href={`/item/${props.story.id}`}>{props.story.title}</Link>}
        >
          <a href={props.story.url} target="_blank" rel="noreferrer">
            {props.story.title}
          </a>
          <span class="host"> ({props.story.domain})</span>
        </Show>
      </span>
      <br />
      <span class="meta">
        <Show
          when={props.story.type !== "job"}
          fallback={<Link href={`/stories/${props.story.id}`}>{props.story.time_ago}</Link>}
        >
          by <Link href={`/users/${props.story.user}`}>{props.story.user}</Link>{" "}
          {props.story.time_ago} |{" "}
          <Link href={`/stories/${props.story.id}`}>
            {props.story.comments_count ? `${props.story.comments_count} comments` : "discuss"}
          </Link>
        </Show>
      </span>
      <Show when={props.story.type !== "link"}>
        {" "}
        <span class="label">{props.story.type}</span>
      </Show>
    </li>
  );
};

export default Story;
