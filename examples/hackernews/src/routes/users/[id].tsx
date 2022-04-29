import { Component, Show } from "solid-js";
import fetchAPI from "~/lib/api";
import { createRouteResource } from "solid-start/router";

interface IUser {
  error: string;
  id: string;
  created: string;
  karma: number;
  about: string;
}

const User: Component = () => {
  const [user] = createRouteResource(({ params }) => `user/${params.id}`, fetchAPI);

  return (
    <div class="user-view">
      <Show when={user()}>
        <Show when={!user().error} fallback={<h1>User not found.</h1>}>
          <h1>User : {user().id}</h1>
          <ul class="meta">
            <li>
              <span class="label">Created:</span> {user().created}
            </li>
            <li>
              <span class="label">Karma:</span> {user().karma}
            </li>
            <Show when={user().about}>
              <li innerHTML={user().about} class="about" />{" "}
            </Show>
          </ul>
          <p class="links">
            <a href={`https://news.ycombinator.com/submitted?id=${user().id}`}>submissions</a> |{" "}
            <a href={`https://news.ycombinator.com/threads?id=${user().id}`}>comments</a>
          </p>
        </Show>
      </Show>
    </div>
  );
};

export default User;
