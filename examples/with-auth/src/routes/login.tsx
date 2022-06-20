import { Show } from "solid-js";
import { useParams, useRouteData } from "solid-app-router";
import { redirect, createServerData, createServerAction } from "solid-start/server";
import { db } from "~/db";
import { createUserSession, getUser, login, register } from "~/db/session";
import { FormError } from "solid-start/data";

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
  return createServerData(async (_, { request }) => {
    if (await getUser(request)) {
      throw redirect("/");
    }
    return {};
  });
}

export default function Login() {
  const data = useRouteData<ReturnType<typeof routeData>>();
  const params = useParams();

  const loginAction = createServerAction(async (form: FormData) => {
    const loginType = form.get("loginType");
    const username = form.get("username");
    const password = form.get("password");
    const redirectTo = form.get("redirectTo") || "/";
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

  return (
    <div class="p-4">
      <div data-light="">
        <main class="p-6 mx-auto w-[fit-content] space-y-4 rounded-lg bg-gray-100">
          <h1 class="font-bold text-xl">Login</h1>
          <loginAction.Form method="post" class="flex flex-col space-y-2">
            <input type="hidden" name="redirectTo" value={params.redirectTo ?? "/"} />
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
              <label for="username-input">Username</label>
              <input
                name="username"
                placeholder="kody"
                class="border-gray-700 border-2 ml-2 rounded-md px-2"
              />
              <Show when={loginAction.error?.fieldErrors?.username}>
                <p class="text-red-400" role="alert">
                  {loginAction.error.fieldErrors.username}
                </p>
              </Show>
            </div>
            <div>
              <label for="password-input">Password</label>
              <input
                name="password"
                type="password"
                placeholder="twixrox"
                class="border-gray-700 border-2 ml-2 rounded-md px-2"
              />
              <Show when={loginAction.error?.fieldErrors?.password}>
                <p class="text-red-400" role="alert">
                  {loginAction.error.fieldErrors.password}
                </p>
              </Show>
            </div>
            <Show when={loginAction.error}>
              <p class="text-red-400" role="alert" id="error-message">
                {loginAction.error.message}
              </p>
            </Show>
            <button class="focus:bg-white hover:bg-white bg-gray-300 rounded-md px-2" type="submit">
              {data() ? "Login" : ""}
            </button>
          </loginAction.Form>
        </main>
      </div>
    </div>
  );
}
