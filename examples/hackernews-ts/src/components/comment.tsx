import { Link } from "solid-app-router";
import { Component, createSignal, For, Show } from "solid-js";

import type { IComment } from "../types";

const pluralize = (n: number) => n + (n === 1 ? " reply" : " replies");

const Comment: Component<{ comment: IComment }> = (props) => {
  const [open, setOpen] = createSignal(true);

  return (
    <li class="comment">
      <div class="by">
        <Link href={`/users/${props.comment.user}`}>{props.comment.user}</Link>{" "}
        {props.comment.time_ago} ago
      </div>
      <div class="text" innerHTML={props.comment.content} />
      <Show when={props.comment.comments.length}>
        <div class="toggle" classList={{ open: open() }}>
          <a onClick={() => setOpen(!open())}>
            {open() ? "[-]" : "[+] " + pluralize(props.comment.comments.length) + " collapsed"}
          </a>
        </div>
        <Show when={open()}>
          <ul class="comment-children">
            <For each={props.comment.comments}>{(comment) => <Comment comment={comment} />}</For>
          </ul>
        </Show>
      </Show>
    </li>
  );
};

export default Comment;
