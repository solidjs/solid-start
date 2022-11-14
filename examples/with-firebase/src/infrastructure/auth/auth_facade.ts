import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { AppUser } from "~/domain/auth/auth";
import { IAuthFacade } from "~/domain/auth/i_auth_facade";
import { auth } from "~/utils/firebaseConfig";

export const firebaseRepository: IAuthFacade = {
  async register(email: string, password: string) {
    const userCredentials = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredentials.user;
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };
  },

  async login(email: string, password: string) {
    const userCredentials = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredentials.user;
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };
  },

  getCurrentUser: function (): Promise<AppUser> {
    const user = auth.currentUser;

    if (user) {
      return Promise.resolve({
        id: user.uid,
        email: user.email,
      });
    }
    return Promise.resolve(null);
  },

  onAuthStateChanged: function (callback: (user: AppUser) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback({
          id: user.uid,
          email: user.email,
        });
      } else {
        callback(null);
      }
    });
  },

  async logout(): Promise<void> {
    signOut(auth);
  },
};
