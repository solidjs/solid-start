import DiscordProvider from "@auth/core/providers/discord";
import { SolidAuth, SolidAuthConfig } from "@auth/solid-start";

export const authOptions: SolidAuthConfig = {
  secret: import.meta.env.AUTH_SECRET as string,
  trustHost: import.meta.env.TRUST_HOST as boolean,
  providers: [
    // @ts-expect-error Types are wrong
    DiscordProvider({
      clientId: import.meta.env.DISCORD_CLIENT_ID as string,
      clientSecret: import.meta.env.DISCORD_CLIENT_SECRET as string
    })
  ]
};

export const { GET, POST } = SolidAuth(authOptions);
