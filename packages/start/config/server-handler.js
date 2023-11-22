/// <reference types="vinxi/types/server" />
import { provideRequestEvent } from "solid-js/web/storage";
import invariant from "vinxi/lib/invariant";
import { eventHandler } from "vinxi/server";
import { getFetchEvent } from "../server/middleware";

export async function handleServerAction(event) {
    invariant(event.method === "POST", "Invalid method");

    const serverReference = event.node.req.headers["server-action"];
    if (serverReference) {
        invariant(typeof serverReference === "string", "Invalid server action");
        const [filepath, name] = serverReference.split("#");
        const action = (
            await import.meta.env.MANIFEST[import.meta.env.ROUTER_NAME].chunks[
                filepath
            ].import()
        )[name];
        const text = await new Promise((resolve) => {
            const requestBody = [];
            event.node.req.on("data", (chunks) => {
                requestBody.push(chunks);
            });
            event.node.req.on("end", () => {
                resolve(requestBody.join(""));
            });
        });
        const json = JSON.parse(text);
        const result = provideRequestEvent(getFetchEvent(event), () => action.apply(null, json));
        try {
            const response = await result;
            event.node.res.setHeader("Content-Type", "application/json");
            event.node.res.setHeader("Router", "server-fns");

            return JSON.stringify(response ?? null);
        } catch (x) {
            console.error(x);
            return new Response(JSON.stringify({ error: x.message }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "x-server-function": "error",
                },
            });
        }
    } else {
        throw new Error("Invalid request");
    }
}

export default eventHandler(handleServerAction);