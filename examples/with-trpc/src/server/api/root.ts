import { exampleRouter } from "./routers/example";
import { createTRPCRouter } from "./utils";

export const appRouter = createTRPCRouter({
  example: exampleRouter
});

export type AppRouter = typeof appRouter;
