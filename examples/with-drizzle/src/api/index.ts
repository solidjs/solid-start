import { action, query } from "@solidjs/router";
import { getUser as gU, logout as l, loginOrRegister as lOR } from "./server";

export const getUser = query(gU, "user");
export const loginOrRegister = action(lOR, "loginOrRegister");
export const logout = action(l, "logout");