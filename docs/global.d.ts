/// <reference types="@solidjs/start/env" />

import { Session, User } from "lucia";
import { lucia } from "./db/auth";

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  username: string;
  githubUsername: string;
  githubId: number;
  githubEmail: string;
  githubImage: string;
}

declare module "solid-js/web" {
  interface RequestEvent {
    locals: {
      nonce: string;
      user: User | null;
      session: Session | null;
    };
  }
}
