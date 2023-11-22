/// <reference types="vinxi/types/server" />
import { crossSerializeStream, fromJSON } from "seroval";
import { provideRequestEvent } from "solid-js/web/storage";
import invariant from "vinxi/lib/invariant";
import { eventHandler } from "vinxi/server";
import { getFetchEvent } from "../server/middleware";

function serializeToStream(id, value) {
  return new ReadableStream({
    start(controller) {
      crossSerializeStream(value, {
        scopeId: id,
        onSerialize(data, initial) {
            const result = initial
                ? `($R["${id}"]=[],${data})`
                : data;
            controller.enqueue(
                new TextEncoder().encode(`${result};\n`),
            );
        },
        onDone() {
            // controller.enqueue(`delete $R["${id}"];\n`);
            controller.close();
        },
        onError(error) {
            // controller.enqueue(`delete $R["${id}"];\n`);
            controller.error(error);
        },
      });
    },
  });
}

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
        const { instance, args } = JSON.parse(text);
        const parsed = fromJSON(args);
        let result = provideRequestEvent(getFetchEvent(event), () => action.apply(null, parsed));
        try {
            result = await result;
            event.node.res.setHeader("Content-Type", "text/javascript");
            event.node.res.setHeader("Router", "server-fns");
            return serializeToStream(instance, result);
        } catch (x) {
            return new Response(serializeToStream(instance, x), {
                status: 500,
                headers: {
                    "Content-Type": "text/javascript",
                    "x-server-function": "error",
                },
            });
        }
    } else {
        throw new Error("Invalid request");
    }
}

export default eventHandler(handleServerAction);