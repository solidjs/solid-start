import GitHub from "@auth/core/providers/github"
import { SolidAuth, type SolidAuthConfig } from "@auth/solid-start"

export const authOpts: SolidAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }) as any,
  ],
  debug: false,
}

export const { GET, POST } = SolidAuth(authOpts)