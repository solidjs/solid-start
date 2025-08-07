import { useSession } from "vinxi/http";
import { redirect } from "@solidjs/router";
import { createUser, findUser } from "./db";

export interface Session {
  id: number;
  email: string;
}

export const getSession = () =>
  useSession<Session>({
    password: process.env.SESSION_SECRET!
  });

export const createSession = async (user: Session, redirectTo?: string) => {
  const validDest = redirectTo?.[0] === "/" && redirectTo[1] !== "/";
  const session = await getSession();
  await session.update(user);
  return redirect(validDest ? redirectTo : "/");
};

export const oauthSignIn = async (email: string, redirectTo?: string) => {
  let user = await findUser({ email });
  if (!user) user = await createUser({ email });
  return createSession(user, redirectTo);
};

export const passwordSignIn = async (email: string, password: string) => {
  let user = await findUser({ email });
  if (!user) {
    user = await createUser({ email, password });
  } else if (!user.password) {
    throw new Error("Account exists via OAuth. Sign in with your OAuth provider");
  } else if (user.password !== password) {
    throw new Error("Invalid email or password");
  }
  return createSession(user);
};
