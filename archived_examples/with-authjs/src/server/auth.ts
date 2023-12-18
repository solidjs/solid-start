import DiscordProvider from "@auth/core/providers/discord";
import type { SolidAuthConfig } from "@solid-auth/base";

export const authOptions: SolidAuthConfig = {
  providers: [
    // @ts-expect-error Types are wrong
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string
    })
  ]
};
