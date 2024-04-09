import DiscordProvider from "@auth/core/providers/discord";
import type { SolidAuthConfig } from "@solid-mediakit/auth/src/index";

export const authOptions: SolidAuthConfig = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string
    })
  ]
};
