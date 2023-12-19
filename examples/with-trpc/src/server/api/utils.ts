import { initTRPC } from "@trpc/server";

export const t = initTRPC.create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
