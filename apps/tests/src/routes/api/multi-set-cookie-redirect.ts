import { setHeader } from "@solidjs/start/http";

export async function GET() {
  // Set a cookie via the event headers (this tests merging event headers)
  setHeader("Set-Cookie", "event_cookie=from_event; Path=/");

  // This tests cloning redirect responses with multiple cookies
  const headers = new Headers();
  headers.append("Location", "http://localhost:3000/");
  headers.append("Set-Cookie", "session=abc123; Path=/; HttpOnly");
  headers.append("Set-Cookie", "csrf=xyz789; Path=/");

  return new Response(null, {
    status: 302,
    headers,
  });
}
