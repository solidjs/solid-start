import { Link, useRouteData } from "solid-start/router";
import { getPosts } from "~/post";
import type { Post } from "~/post";
import { createResource, For } from "solid-js";
import server from "solid-start/server";

export function routeData() {
  return createResource(server(getPosts));
}
// ...
export default function Posts() {
  const [posts] = useRouteData<ReturnType<typeof routeData>>();
  return (
    <div>
      <h1>Posts</h1>
      <ul>
        <For each={posts()}>
          {post => (
            <li>
              <Link href={post.slug}>{post.title}</Link>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
