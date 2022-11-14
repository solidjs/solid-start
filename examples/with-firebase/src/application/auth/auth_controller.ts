import { AppUser } from "~/domain/auth/auth";
import { IAuthFacade } from "~/domain/auth/i_auth_facade";
import { firebaseRepository } from "~/infrastructure/auth/auth_facade";

const repo: IAuthFacade = firebaseRepository;

export default {
  async register(email: string, password: string) {
    try {
      const user = await repo.register(email, password);
      return user;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async login(email: string, password: string) {
    try {
      const user = await repo.login(email, password);
      return user;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async getCurrentUser() {
    const user = await repo.getCurrentUser();
    return user;
  },

  onAuthStateChanged(callback: (user: AppUser) => void) {
    try {
      return repo.onAuthStateChanged(callback);
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async logout() {
    try {
      await repo.logout();
    } catch (error) {
      throw new Error(error.message);
    }
  },
};
