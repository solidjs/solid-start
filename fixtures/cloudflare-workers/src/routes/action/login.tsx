import server, { redirect, createServerAction } from "solid-start/server";
import { db } from "~/db";
import { createUserSession, getUser, login, register } from "~/db/session";
import { useRouteData, useParams, useNavigate, FormError } from "solid-start/router";
import { createResource, Show } from "solid-js";

function validateUsername(username: unknown) {
  if (typeof username !== "string" || username.length < 3) {
    return `Usernames must be at least 3 characters long`;
  }
}

function validatePassword(password: unknown) {
  if (typeof password !== "string" || password.length < 6) {
    return `Passwords must be at least 6 characters long`;
  }
}

export function routeData() {
  return createResource(
    server(async function () {
      if (await getUser(server.request)) {
        throw redirect("/action");
      }
      return {};
    })
  );
}

export default function Login() {
  const [data] = useRouteData<ReturnType<typeof routeData>>();
  const navigate = useNavigate();
  const [submissions, action] = createServerAction(async (form: FormData) => {
    const loginType = form.get("loginType");
    const username = form.get("username");
    const password = form.get("password");
    const redirectTo = form.get("redirectTo") || "/action";
    if (
      typeof loginType !== "string" ||
      typeof username !== "string" ||
      typeof password !== "string" ||
      typeof redirectTo !== "string"
    ) {
      throw new FormError(`Form not submitted correctly.`);
    }

    const fields = { loginType, username, password };
    const fieldErrors = {
      username: validateUsername(username),
      password: validatePassword(password)
    };
    if (Object.values(fieldErrors).some(Boolean)) {
      throw new FormError("Fields invalid", { fieldErrors, fields });
    }

    switch (loginType) {
      case "login": {
        const user = await login({ username, password });
        if (!user) {
          throw new FormError(`Username/Password combination is incorrect`, {
            fields
          });
        }
        return createUserSession(`${user.id}`, redirectTo);
      }
      case "register": {
        const userExists = await db.user.findUnique({ where: { username } });
        if (userExists) {
          throw new FormError(`User with username ${username} already exists`, {
            fields
          });
        }
        const user = await register({ username, password });
        if (!user) {
          throw new FormError(`Something went wrong trying to create a new user.`, {
            fields
          });
        }
        return createUserSession(`${user.id}`, redirectTo);
      }
      default: {
        throw new FormError(`Login type invalid`, { fields });
      }
    }
  });

  const params = useParams();
  return (
    <div class="p-4">
      <div data-light="">
        <main class="p-6 mx-auto w-[fit-content] space-y-4 rounded-lg bg-gray-100">
          <h1 class="font-bold text-xl">Login</h1>
          <form
            method="post"
            class="flex flex-col space-y-2"
            onSubmit={e => {
              e.preventDefault();
              action(new FormData(e.currentTarget), "login").then(res => {
                navigate("/action");
              });
            }}
          >
            <input type="hidden" name="redirectTo" value={params.redirectTo ?? "/action"} />
            <fieldset class="flex flex-row">
              <legend class="sr-only">Login or Register?</legend>
              <label class="w-full">
                <input type="radio" name="loginType" value="login" checked={true} /> Login
              </label>
              <label class="w-full">
                <input type="radio" name="loginType" value="register" /> Register
              </label>
            </fieldset>
            <div>
              <label htmlFor="username-input">Username</label>
              <input
                name="username"
                placeholder="kody"
                class="border-gray-700 border-2 ml-2 rounded-md px-2"
              />
              <Show when={submissions()["login"]?.error?.fieldErrors?.username}>
                <p class="text-red-400" role="alert">
                  {submissions()["login"]?.error.fieldErrors.username}
                </p>
              </Show>
            </div>
            <div>
              <label htmlFor="password-input">Password</label>
              <input
                name="password"
                type="password"
                placeholder="twixrox"
                class="border-gray-700 border-2 ml-2 rounded-md px-2"
              />
              <Show when={submissions()["login"]?.error?.fieldErrors?.password}>
                <p class="text-red-400" role="alert">
                  {submissions()["login"]?.error.fieldErrors.password}
                </p>
              </Show>
            </div>
            <Show when={submissions()["login"]?.error}>
              <p class="text-red-400" role="alert" id="error-message">
                {submissions()["login"]?.error.message}
              </p>
            </Show>
            <button class="focus:bg-white hover:bg-white bg-gray-300 rounded-md px-2" type="submit">
              {data() ? "Login" : ""}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
