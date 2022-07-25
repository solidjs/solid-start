import { Link } from "solid-app-router";
import { Component, ComponentProps, For, lazy, sharedConfig, Show } from "solid-js";

function island<T extends Component<any>>(
  fn: () => Promise<{
    default: T;
  }>,
  path?: string
): T & {
  preload: () => Promise<{
    default: T;
  }>;
} {
  const Toggle = lazy(fn);

  let a: T & {
    preload: () => Promise<{
      default: T;
    }>;
  } = ((compProps: ComponentProps<T>) => {
    if (import.meta.env.SSR) {
      const { children, ...props } = compProps;
      return (
        <solid-island
          data-props={JSON.stringify(props)}
          data-island={sharedConfig.context.id}
          data-component={path}
        >
          <Toggle {...props}>
            <solid-children>{children}</solid-children>
          </Toggle>
        </solid-island>
      );
    } else {
      return null;
    }
  }) as any;

  a.preload = Toggle.preload;
  return a;
}

const Toggle = island(() => import("./toggle"));

const Comment: Component<{ comment: IComment }> = props => {
  return (
    <li class="comment">
      <div class="by">
        <Link href={`/users/${props.comment.user}`}>{props.comment.user}</Link>{" "}
        {props.comment.time_ago} ago
      </div>
      <div class="text" innerHTML={props.comment.content} />
      <Show when={props.comment.comments.length}>
        <Toggle>
          <For each={props.comment.comments}>{comment => <Comment comment={comment} />}</For>
        </Toggle>
      </Show>
    </li>
  );
};

export default Comment;
