import OAuth, { type Configuration } from "start-oauth";
import { oauthSignIn } from "~/lib/server";

const config: Configuration = {
  password: process.env.SESSION_SECRET!,
  discord: {
    id: process.env.DISCORD_ID!,
    secret: process.env.DISCORD_SECRET!
  },
  handler: async ({ email }, redirectTo) => oauthSignIn(email, redirectTo)
};

export const GET = OAuth(config);
