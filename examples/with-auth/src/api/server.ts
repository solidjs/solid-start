"use server";
import { redirect } from "@solidjs/router";
import { getH3Event, useSession } from "@solidjs/start/server";
import { getRequestEvent } from "solid-js/web";
import { db } from "./db";

function validateUsername(username: unknown) {
  if (typeof username !== "string" || username.length < 3) {
    return `Usernames must be at least 3 characters long`;
  }
}

function validatePassword(password: unknown) {
  if (typeof password !== "string" || password.length < 6) {
    return `Passwords must be at least 6 characters long`;
  }
}

async function login(username: string, password: string) {
  const user = await db.user.findUnique({ where: { username } });
  if (!user || password !== user.password) throw new Error("Invalid login");
  return user;
}

async function register(username: string, password: string) {
  const existingUser = await db.user.findUnique({ where: { username } });
  if (existingUser) throw new Error("User already exists");
  return db.user.create({
    data: { username: username, password }
  });
}

function getSession() {
  const event = getH3Event(getRequestEvent() as any);
  return useSession(event, {
    password: process.env.SESSION_SECRET
  });
}

export async function loginOrRegister(formData: FormData) {
  const username = String(formData.get("username"));
  const password = String(formData.get("password"));
  const loginType = String(formData.get("loginType"));
  let error = validateUsername(username) || validatePassword(password);
  if (error) throw new Error(error);

  let user = await (loginType !== "login"
    ? register(username, password)
    : login(username, password));
  const session = await getSession();
  session.update(d => (d.userId = user!.id));
  return redirect("/");
  // return redirect(redirectTo, {
  //   headers: {
  //     "Set-Cookie": await storage.commitSession(session)
  //   }
  // });
}

export async function logout() {
  const session = await getSession();
  session.update(d => (d.userId = null));
  return redirect("/login");
  // return redirect("/login", {
  //   headers: {
  //     "Set-Cookie": await storage.destroySession(session)
  //   }
  // });
}

export async function getUser() {
  const session = await getSession();
  const userId = session.data.userId;
  if (!userId || typeof userId !== "string") throw redirect("/login");

  try {
    const user = await db.user.findUnique({ where: { id: Number(userId) } });
    if (!user) throw redirect("/login");
    return user;
  } catch {
    throw logout();
  }
};


