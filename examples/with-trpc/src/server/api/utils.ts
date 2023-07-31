import { initTRPC } from "@trpc/server";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  return {
    ...opts
  };
};

export const t = initTRPC.context<typeof createTRPCContext>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
