import type { APIHandler } from "@solidjs/start/server";

export const GET: APIHandler = async ({ params }) => {
  return `Hello ${params.name}!`;
};