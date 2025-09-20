"use server";

import { isServer } from "solid-js/web";

export const serverFnWithIsServer = async () => {
    return isServer;
}
