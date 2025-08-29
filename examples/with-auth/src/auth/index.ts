import { action, query, redirect } from "@solidjs/router";
import { getSession, passwordLogin } from "./server";

// Define routes that require being logged in
const PROTECTED_ROUTES = ["/"];

const isProtected = (path: string) =>
  PROTECTED_ROUTES.some(route =>
    route.endsWith("/*")
      ? path.startsWith(route.slice(0, -2))
      : path === route || path.startsWith(route + "/")
  );

export const querySession = query(async (path: string) => {
  "use server";
  const { data } = await getSession();
  if (path === "/login" && data.id) return redirect("/");
  if (data.id) return data;
  if (isProtected(path)) throw redirect(`/login?redirect=${path}`);
  return null;
}, "session");

export const formLogin = action(async (formData: FormData) => {
  "use server";
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string")
    return new Error("Email and password are required");
  return await passwordLogin(email.trim().toLowerCase(), password);
});

export const logout = action(async () => {
  "use server";
  const session = await getSession();
  await session.update({ id: undefined });
  return redirect("/login", { revalidate: "session" });
});
