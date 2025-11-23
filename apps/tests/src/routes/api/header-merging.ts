import { getRequestURL, setHeader, useSession } from "@solidjs/start/http";

export async function GET() {
  const url = getRequestURL();

  const s = await useSession({ password: "0".repeat(32) });
  await s.update(d => ({count: (d.count || 0) + 1}))

  setHeader("x-event-header", "value");
  setHeader("x-shared-header", "event");

  if(url.searchParams.get("status") === "redirect") {
    return new Response(null, {
      status: 301,
      headers: {
        location: "http://::/abc",
        "x-return-header": "value",
        "x-shared-header": "return"
      }
    })
  } else {
    return new Response(null, {
      headers: {
        "x-return-header": "value",
        "x-shared-header": "return"
      }
    })
  }
}
