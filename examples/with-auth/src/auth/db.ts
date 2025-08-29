import { createStorage } from "unstorage";
import fsLiteDriver from "unstorage/drivers/fs-lite";

interface User {
  id: number;
  email: string;
  password?: string;
}

const storage = createStorage({ driver: fsLiteDriver({ base: "./.data" }) });

export async function createUser(data: Pick<User, "email" | "password">) {
  const users = (await storage.getItem<User[]>("users:data")) ?? [];
  const counter = (await storage.getItem<number>("users:counter")) ?? 1;
  const user: User = { id: counter, ...data };
  await Promise.all([
    storage.setItem("users:data", [...users, user]),
    storage.setItem("users:counter", counter + 1)
  ]);
  return user;
}

export async function findUser({ email, id }: { email?: string; id?: number }) {
  const users = (await storage.getItem<User[]>("users:data")) ?? [];
  if (id) return users.find(u => u.id === id);
  if (email) return users.find(u => u.email === email);
  return undefined;
}
