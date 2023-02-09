import DiscordProvider from "@auth/core/providers/discord";
import { SolidAuth, SolidAuthConfig } from "@auth/solid-start";

export const authOptions: SolidAuthConfig = {
  providers: [
    // @ts-expect-error Types are wrong
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string
    })
  ]
};

export const { GET, POST } = SolidAuth(authOptions);
