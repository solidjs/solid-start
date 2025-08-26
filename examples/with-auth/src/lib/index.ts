import { action, query, redirect } from "@solidjs/router";
import { getSession, passwordSignIn } from "./server";

// Define which routes require authentication
const PROTECTED_ROUTES = ["/"];

const isProtectedRoute = (path: string) =>
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
  if (isProtectedRoute(path)) throw redirect(`/login?redirect=${path}`);
  return null;
}, "session");

export const passwdSignIn = action(async (formData: FormData) => {
  "use server";
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string")
    return new Error("Email and password are required");
  return await passwordSignIn(email.trim().toLowerCase(), password);
});

export const logout = action(async () => {
  "use server";
  const session = await getSession();
  await session.update({ id: undefined });
  throw redirect("/login", { revalidate: "session" });
});
