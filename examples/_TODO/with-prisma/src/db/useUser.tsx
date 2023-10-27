import { PrismaClient } from "@prisma/client";
import { createServerData$, redirect } from "solid-start/server";
import { getUser } from "./session";

export const useUser = () =>
  createServerData$(async (_, { request }) => {
    const db = new PrismaClient();
    const user = await getUser(db, request);

    if (!user) {
      throw redirect("/login");
    }

    return user;
  });
