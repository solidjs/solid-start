import {
  useSubmission,
  type RouteSectionProps
} from "@solidjs/router";
import { loginOrRegister } from "~/api";

export default function Login(props: RouteSectionProps) {
  const loggingIn = useSubmission(loginOrRegister);

  return (
    <main>
      <h1>Login</h1>
      <form action={loginOrRegister}>
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
        <Show when={loggingIn.result?.fieldErrors?.username}>
          <p role="alert">{loggingIn.result.fieldErrors.username}</p>
        </Show>
        <div>
          <label for="password-input">Password</label>
          <input name="password" type="password" placeholder="twixrox" />
        </div>
        <Show when={loggingIn.result?.fieldErrors?.password}>
          <p role="alert">{loggingIn.result?.fieldErrors.password}</p>
        </Show>
        <Show when={loggingIn.result}>
          <p role="alert" id="error-message">
            {loggingIn.result.message}
          </p>
        </Show>
        <button type="submit">Login</button>
      </form>
    </main>
  );
}
