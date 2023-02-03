import { getSession } from "@auth/solid-start";
import { signIn } from "@auth/solid-start/client";
import { useParams, useRouteData } from "solid-start";
import { createRouteAction } from "solid-start/data";
import { createServerData$, redirect } from "solid-start/server";
import { authOpts } from "./api/auth/[...solidauth]";

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
  return createServerData$(async (_, { request }) => {
    if (await getSession(request, authOpts)) {
      throw redirect("/");
    }
    return {};
  });
}

export default function Login() {
  const data = useRouteData<typeof routeData>();
  const params = useParams();

  const [loggingIn, { Form }] = createRouteAction(async (form: FormData) => {
    console.log(await signIn("github"));
  });

  return (
    <main>
      <h1>Login</h1>
      <Form>
        <button type="submit">{data() ? "Login" : ""}</button>
      </Form>
    </main>
  );
}
