import { action, createAsync, query, redirect } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";

const readCookie = query(async () => {
  "use server";
  const cookies = getRequestEvent()!.request.headers.get("cookie") ?? "";
  const match = /(?:^|;\s*)single_flight_cookie=([^;]*)/.exec(cookies);
  return match ? match[1] : "none";
}, "single-flight-cookie");

const setCookie = action(async () => {
  "use server";
  throw redirect("/single-flight-cookie", {
    headers: {
      "Set-Cookie": "single_flight_cookie=1234; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600",
    },
  });
}, "single-flight-cookie-set");

// the preload is what the single flight re-render runs to collect data for the
// redirect target, so the mutation response carries the fresh cookie value
export const route = {
  preload: () => readCookie(),
};

export default function SingleFlightCookie() {
  const value = createAsync(() => readCookie(), { deferStream: true });

  return (
    <main>
      <h1>Single Flight Cookie</h1>
      <p id="cookie-value">{value()}</p>
      <form action={setCookie} method="post">
        <button type="submit">set cookie</button>
      </form>
    </main>
  );
}
