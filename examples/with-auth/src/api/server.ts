"use server";
import { redirect } from "@solidjs/router";
import { getH3Event, useSession } from "@solidjs/start/server";
import { fileURLToPath } from "node:url";
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
  if (error) return new Error(error);

  try {
    const user = await (loginType !== "login"
      ? register(username, password)
      : login(username, password));
    const session = await getSession();
    await session.update(d => (d.userId = user!.id));
  } catch (err) {
    return err as Error;
  }
  throw redirect("/");
}
// hack until Vinxi update
loginOrRegister.url = `/_server?id=${encodeURIComponent(fileURLToPath(new URL(import.meta.url)))}&name=${loginOrRegister.name}`

export async function logout() {
  const session = await getSession();
  await session.update(d => (d.userId = undefined));
  throw redirect("/login");
}
logout.url = `/_server?id=${encodeURIComponent(fileURLToPath(new URL(import.meta.url)))}&name=${logout.name}`

export async function getUser() {
  const session = await getSession();
  const userId = session.data.userId;
  if (userId === undefined) throw redirect("/login");

  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw redirect("/login");
    return user;
  } catch {
    throw logout();
  }
}
