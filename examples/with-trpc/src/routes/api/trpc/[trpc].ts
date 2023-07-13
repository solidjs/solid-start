import { createSolidAPIHandler } from "solid-start-trpc";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/utils";

const handler = createSolidAPIHandler({
  router: appRouter,
  createContext: createTRPCContext
});

export const GET = handler;
export const POST = handler;
