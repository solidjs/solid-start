import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/solid";

export const authClient = createAuthClient({
  plugins: [usernameClient()]
});
