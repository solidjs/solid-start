import { AppUser } from "~/domain/auth/auth";

export type IAuthFacade = {
  login: (email: string, password: string) => Promise<AppUser>;
  register: (email: string, password: string) => Promise<AppUser>;
  getCurrentUser: () => Promise<AppUser | null>;
  onAuthStateChanged: (callback: (user: AppUser | null) => void) => () => void;
  logout: () => Promise<void>;
};
