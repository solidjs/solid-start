import { RouteDataFuncArgs, useRouteData } from "@solidjs/router";
import { Component, Show, createResource } from "solid-js";
import fetchAPI from "~/lib/api";

interface IUser {
  error: string;
  id: string;
  created: string;
  karma: number;
  about: string;
}

export const route = {
  data(props: RouteDataFuncArgs) {
    const [user] = createResource<IUser, string>(() => `user/${props.params.id}`, fetchAPI);
    return user;
  }
};

const User: Component = () => {
  const user = useRouteData<typeof route.data>();
  return (
    <div class="user-view">
      <Show when={user()}>
        <Show when={!user()!.error} fallback={<h1>User not found.</h1>}>
          <h1>User : {user()!.id}</h1>
          <ul class="meta">
            <li>
              <span class="label">Created:</span> {user()!.created}
            </li>
            <li>
              <span class="label">Karma:</span> {user()!.karma}
            </li>
            <Show when={user()!.about}>
              <li innerHTML={user()!.about} class="about" />{" "}
            </Show>
          </ul>
          <p class="links">
            <a href={`https://news.ycombinator.com/submitted?id=${user()!.id}`}>submissions</a> |{" "}
            <a href={`https://news.ycombinator.com/threads?id=${user()!.id}`}>comments</a>
          </p>
        </Show>
      </Show>
    </div>
  );
};

export default User;
