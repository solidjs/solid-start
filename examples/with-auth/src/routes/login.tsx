import {
  useAction,
  useSubmission,
  type RouteSectionProps
} from "@solidjs/router";
import { Show } from "solid-js";
import { loginOrRegister } from "~/api";

export default function Login(props: RouteSectionProps) {
  const loggingIn = useSubmission(loginOrRegister);
  const login = useAction(loginOrRegister);

  return (
    <main>
      <h1>Login</h1>
      <form onSubmit={
        e => {
          e.preventDefault();
          login(new FormData(e.currentTarget));
        }
      }>
        <input type="hidden" name="redirectTo" value={props.params.redirectTo ?? "/"} />
        <fieldset>
          <legend>Login or Register?</legend>
          <label>
            <input type="radio" name="loginType" value="login" checked={true} /> Login
          </label>
          <label>
            <input type="radio" name="loginType" value="register" /> Register
          </label>
        </fieldset>
        <div>
          <label for="username-input">Username</label>
          <input name="username" placeholder="kody" />
        </div>
        <div>
          <label for="password-input">Password</label>
          <input name="password" type="password" placeholder="twixrox" />
        </div>
        <Show when={loggingIn.result}>
          <p role="alert" id="error-message">
            {loggingIn.result!.message}
          </p>
        </Show>
        <button type="submit">Login</button>
      </form>
    </main>
  );
}
