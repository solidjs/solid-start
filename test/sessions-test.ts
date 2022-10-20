import { expect, test } from "@playwright/test";
import type { AppFixture } from "./helpers/create-fixture.js";
import { createFixture, js } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("sessions", () => {
  let appFixture: AppFixture;
  test.beforeAll(async () => {
    appFixture = await (
      await createFixture({
        files: {
          "src/routes/index.tsx": js`
            import server$, { redirect, createServerData$, createServerAction$ } from "solid-start/server";
            import { useRouteData } from "solid-start";
            import { getUser, logout } from "~/session";

            export function routeData() {
              return createServerData$(async (_, { request }) => {
                const user = await getUser(request);

                if (!user) {
                  throw redirect("/login");
                }

                return user;
              });
            }

            export default function Home() {
              const user = useRouteData<ReturnType<typeof routeData>>();
              const [, { Form }] = createServerAction$((_, { request }) => logout(request));

              return (
                <main class="w-full p-4 space-y-2">
                  <h1 class="font-bold text-3xl">Hello {user()?.username}</h1>
                  <h3 class="font-bold text-xl">Message board</h3>
                  <Form>
                    <button name="logout" type="submit">
                      Logout
                    </button>
                  </Form>
                </main>
              );
            }
          `,
          "src/routes/login.tsx": js`
            import { Show } from "solid-js";
            import { useParams, useRouteData } from "solid-start";
            import { redirect, createServerData$, createServerAction$ } from "solid-start/server";
            import { db, createUserSession, getUser, login, register } from "~/session";
            import { FormError } from "solid-start/data";
            
            function validateUsername(username: unknown) {
              if (typeof username !== "string" || username.length < 3) {
                return "Usernames must be at least 3 characters long";
              }
            }
            
            function validatePassword(password: unknown) {
              if (typeof password !== "string" || password.length < 6) {
                return "Passwords must be at least 6 characters long";
              }
            }
            
            export function routeData() {
              return createServerData$(async (_, { request }) => {
                if (await getUser(request)) {
                  throw redirect("/");
                }
                return {};
              });
            }
            
            export default function Login() {
              const data = useRouteData<ReturnType<typeof routeData>>();
              const params = useParams();
            
              const [loggingIn, { Form }] = createServerAction$(async (form: FormData) => {
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
                  throw new FormError("Form not submitted correctly.");
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
                      throw new FormError("Username/Password combination is incorrect", {
                        fields
                      });
                    }
                    return createUserSession(user.id, redirectTo);
                  }
                  case "register": {
                    const userExists = await db.user.findUnique({ where: { username } });
                    if (userExists) {
                      throw new FormError("User with username " + username + " already exists", {
                        fields
                      });
                    }
                    const user = await register({ username, password });
                    if (!user) {
                      throw new FormError("Something went wrong trying to create a new user.", {
                        fields
                      });
                    }
                    return createUserSession(user.id, redirectTo);
                  }
                  default: {
                    throw new FormError("Login type invalid", { fields });
                  }
                }
              });
            
              return (
                <div class="p-4">
                  <div data-light="">
                    <main class="p-6 mx-auto w-[fit-content] space-y-4 rounded-lg bg-gray-100">
                      <h1 class="font-bold text-xl">Login</h1>
                      <Form method="post" class="flex flex-col space-y-2">
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
                          <Show when={loggingIn.error?.fieldErrors?.username}>
                            <p class="text-red-400" role="alert">
                              {loggingIn.error.fieldErrors.username}
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
                          <Show when={loggingIn.error?.fieldErrors?.password}>
                            <p class="text-red-400" role="alert">
                              {loggingIn.error.fieldErrors.password}
                            </p>
                          </Show>
                        </div>
                        <Show when={loggingIn.error}>
                          <p class="text-red-400" role="alert" id="error-message">
                            {loggingIn.error.message}
                          </p>
                        </Show>
                        <button class="focus:bg-white hover:bg-white bg-gray-300 rounded-md px-2" type="submit">
                          {data() ? "Login" : ""}
                        </button>
                      </Form>
                    </main>
                  </div>
                </div>
              );
            }
          `,
          "src/session.tsx": js`
            import { redirect } from "solid-start/server";
            import { createCookieSessionStorage } from "solid-start/session";
            let users = [{ id: "0", username: "kody", password: "twixrox" }];

            export const db = {
              user: {
                async create({ data }) {
                  let user = { ...data, id: users.length };
                  users.push(user);
                  return user;
                },
                async findUnique({ where: { username = undefined, id = undefined } }) {
                  if (id !== undefined) {
                    return users.find(user => user.id === id);
                  } else {
                    return users.find(user => user.username === username);
                  }
                }
              }
            };

            type LoginForm = {
              username: string;
              password: string;
            };

            export async function register({ username, password }: LoginForm) {
              return db.user.create({
                data: { username: username, password }
              });
            }

            export async function login({ username, password }: LoginForm) {
              const user = await db.user.findUnique({ where: { username } });
              if (!user) return null;
              const isCorrectPassword = password === user.password;
              if (!isCorrectPassword) return null;
              return user;
            }

            const sessionSecret = import.meta.env.SESSION_SECRET;

            const storage = createCookieSessionStorage({
              cookie: {
                name: "RJ_session",
                // secure doesn't work on localhost for Safari
                // https://web.dev/when-to-use-local-https/
                secure: true,
                secrets: ["hello"],
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 30,
                httpOnly: true
              }
            });

            export function getUserSession(request: Request) {
              return storage.getSession(request.headers.get("Cookie"));
            }

            export async function getUserId(request: Request) {
              const session = await getUserSession(request);
              const userId = session.get("userId");
              if (!userId || typeof userId !== "string") return null;
              return userId;
            }

            export async function requireUserId(
              request: Request,
              redirectTo: string = new URL(request.url).pathname
            ) {
              const session = await getUserSession(request);
              const userId = session.get("userId");
              if (!userId || typeof userId !== "string") {
                const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
                throw redirect("/login?" + searchParams);
              }
              return userId;
            }

            export async function getUser(request: Request) {
              const userId = await getUserId(request);
              if (typeof userId !== "string") {
                return null;
              }

              try {
                const user = await db.user.findUnique({ where: { id: userId } });
                return user;
              } catch {
                throw logout(request);
              }
            }

            export async function logout(request: Request) {
              const session = await storage.getSession(request.headers.get("Cookie"));
              return redirect("/login", {
                headers: {
                  "Set-Cookie": await storage.destroySession(session)
                }
              });
            }

            export async function createUserSession(userId: string, redirectTo: string) {
              const session = await storage.getSession();
              session.set("userId", userId);
              return redirect(redirectTo, {
                headers: {
                  "Set-Cookie": await storage.commitSession(session)
                }
              });
            }
          `
        }
      })
    ).createServer();
  });

  test.afterAll(async () => {
    await appFixture.close();
  });

  test.describe("with JavaScript", () => {
    runTests(true);
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });
    runTests(false);
  });

  function runTests(javaScriptEnabled) {
    test("auth flow", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");

      console.log(`redirect to login page`);
      await app.waitForURL("/login");

      console.log("testing wrong password");
      await page.fill('input[name="username"]', "kody");
      await page.fill('input[name="password"]', "twixroxx");
      await page.click("button[type=submit]");

      if (!javaScriptEnabled) {
        await page.waitForURL(/Username%2FPassword%20combination%20is%20incorrect%22/);
      }

      await expect(page.locator("#error-message")).toHaveText(
        "Username/Password combination is incorrect"
      );

      // await page.click("#reset-errors");

      console.log("testing wrong username");
      await page.fill('input[name="username"]', "kod");
      await page.fill('input[name="password"]', "twixrox");
      await page.click("button[type=submit]");

      if (!javaScriptEnabled) {
        await page.waitForURL(/Username%2FPassword%20combination%20is%20incorrect%22/);
      }

      await expect(page.locator("#error-message")).toHaveText(
        "Username/Password combination is incorrect",
        {
          timeout: 10000
        }
      );

      console.log("testing invalid password");
      await page.fill('input[name="username"]', "kody");
      await page.fill('input[name="password"]', "twix");
      await page.click("button[type=submit]");
      if (!javaScriptEnabled) {
        await page.waitForURL(/Fields%20invalid/);
      }

      await expect(page.locator("#error-message")).toHaveText("Fields invalid");

      console.log("login");
      await page.fill('input[name="username"]', "kody");
      await page.fill('input[name="password"]', "twixrox");
      await page.click("button[type=submit]");

      console.log(`redirect to home after login`);
      await app.waitForURL("/");

      console.log(`going to login page should redirect to home page since we are logged in`);
      await app.goto("/login");
      await app.waitForURL("/");

      console.log(`logout`);
      await page.click("button[name=logout]");
      await app.waitForURL("/login");

      console.log(`going to home should redirect to login`);
      await app.goto("/");
      await app.waitForURL("/login");
    });
  }
});
