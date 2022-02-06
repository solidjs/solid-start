import { createForm, FormError } from "solid-start/form";
import server, { json, redirect } from "solid-start/server";
import { db } from "~/db";
import { createUserSession, getUser, login, register } from "~/session";
import { Link, useData, useParams } from "solid-app-router";
import { createComputed, createResource } from "solid-js";
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

type ActionData = {
  formError?: string;
  fieldErrors?: { username: string | undefined; password: string | undefined };
  fields?: { loginType: string; username: string; password: string };
};

/**
 * This helper function gives us typechecking for our ActionData return
 * statements, while still returning the accurate HTTP status, 400 Bad Request,
 * to the client.
 */
const loginForm = createForm(
  server(async (form: FormData) => {
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
        const userExists = await db.user.findFirst({ where: { username } });
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
  })
);

export function routeData() {
  return createResource(
    server(async () => {
      console.log("hereee");
      if (await getUser(server.getContext().request)) {
        console.log("redirecting");
        throw redirect("/");
      }
      return {};
    })
  );
}

export default function Login() {
  const [data] = useData();
  createComputed(() => data());
  const params = useParams();
  return (
    <div className="p-4">
      <div data-light="">
        <main class="p-6 mx-auto w-[fit-content] space-y-4 rounded-lg bg-gray-100">
          <h1 class="font-bold text-xl">Login</h1>
          <loginForm.Form
            method="post"
            class="flex flex-col space-y-2"
            // aria-describedby={actionData?.formError ? "form-error-message" : undefined}
          >
            <input type="hidden" name="redirectTo" value={params.redirectTo ?? "/"} />
            <fieldset class="flex flex-row">
              <legend className="sr-only">Login or Register?</legend>
              <label class="w-full">
                <input
                  type="radio"
                  name="loginType"
                  value="login"
                  checked={true}
                  // defaultChecked={
                  //   !actionData?.fields?.loginType || actionData?.fields?.loginType === "login"
                  // }
                />{" "}
                Login
              </label>
              <label class="w-full">
                <input
                  type="radio"
                  name="loginType"
                  value="register"
                  // defaultChecked={actionData?.fields?.loginType === "register"}
                />{" "}
                Register
              </label>
            </fieldset>
            <div>
              <label htmlFor="username-input">Username</label>
              <input
                name="username"
                placeholder="vinxi"
                class="border-gray-700 border-2 ml-2 rounded-md px-2"
              />
              {/* {actionData?.fieldErrors?.username ? (
              <p className="form-validation-error" role="alert" id="username-error">
                {actionData.fieldErrors.username}
              </p>
            ) : null} */}
            </div>
            <div>
              <label htmlFor="password-input">Password</label>
              <input
                name="password"
                type="password"
                placeholder="vinxi"
                class="border-gray-700 border-2 ml-2 rounded-md px-2"
              />
              {/* {actionData?.fieldErrors?.password ? (
              <p className="form-validation-error" role="alert" id="password-error">
                {actionData.fieldErrors.password}
              </p>
            ) : null} */}
            </div>
            {/* <div id="form-error-message"> */}
            {/* {actionData?.formError ? (
              <p className="form-validation-error" role="alert">
                {actionData.formError}
              </p>
            ) : null}
          </div> */}

            <button class="focus:bg-white hover:bg-white bg-gray-300 rounded-md px-2" type="submit">
              Login
            </button>
          </loginForm.Form>
        </main>
      </div>
    </div>
  );
}
