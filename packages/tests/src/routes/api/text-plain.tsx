import type { APIEvent } from "@solidjs/start/server";

export const GET = (event: APIEvent) => {
  return new Response("Text Plain Response");
};
