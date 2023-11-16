import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../utils";

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure.input(z.string()).query(({ input }) => {
    return `Hello ${input}!`;
  })
});
