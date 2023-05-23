import DiscordProvider from "@auth/core/providers/discord";
import type { SolidAuthConfig } from "@solid-auth/base";

export const authOptions: SolidAuthConfig = {
  providers: [
    DiscordProvider({
      clientId: import.meta.env.DISCORD_CLIENT_ID as string,
      clientSecret: import.meta.env.DISCORD_CLIENT_SECRET as string
    })
  ],
  secret: import.meta.env.AUTH_SECRET as string,
  trustHost: true
};
