/// <reference types="vinxi/types/server" />
import { crossSerializeStream, fromJSON } from "seroval";
import { provideRequestEvent } from "solid-js/web/storage";
import invariant from "vinxi/lib/invariant";
import { eventHandler, getHeader, getRequestURL, readBody, readFormData, setHeader } from "vinxi/server";
import { getFetchEvent } from "../server/middleware";

function serializeToStream(id, value) {
  return new ReadableStream({
    start(controller) {
      crossSerializeStream(value, {
        scopeId: id,
        onSerialize(data, initial) {
          const result = initial ? `($R["${id}"]=[],${data})` : data;
          controller.enqueue(new TextEncoder().encode(`${result};\n`));
        },
        onDone() {
          // controller.enqueue(`delete $R["${id}"];\n`);
          controller.close();
        },
        onError(error) {
          // controller.enqueue(`delete $R["${id}"];\n`);
          controller.error(error);
        }
      });
    }
  });
}

async function handleServerFunction(event) {
  invariant(event.method === "POST", "Invalid method");

  const serverReference = getHeader(event, "server-fn");
  const instance = getHeader(event, "server-fn-instance");
  const url = getRequestURL(event);
  let filepath, name;
  if (serverReference) {
    invariant(typeof serverReference === "string", "Invalid server function");
    [filepath, name] = serverReference.split("#");
  } else {
    filepath = url.searchParams.get("id")
    name = url.searchParams.get("name");
    if (!filepath || !name) throw new Error("Invalid request");
  }

  const action = (
    await import.meta.env.MANIFEST[import.meta.env.ROUTER_NAME].chunks[filepath].import()
  )[name];
  let parsed;
  const contentType = getHeader(event, "content-type");
  if (contentType.startsWith("multipart/form-data") || contentType.startsWith("application/x-www-form-urlencoded")) {
    parsed = [await readFormData(event)];
  } else {
    parsed = fromJSON(await readBody(event));
  }
  try {
    const result = await provideRequestEvent(getFetchEvent(event), () =>
      action.apply(null, parsed)
    );

    // handle no JS success case
    if (!instance) {
      const isError = result instanceof Error
      return new Response(null, {
        status: 302,
        headers: {
          Location:
            new URL(getHeader(event, "referer")).pathname +
            "?form=" +
            encodeURIComponent(
              JSON.stringify({
                url: url.pathname + url.search,
                result: isError ? result.message : result,
                error: isError,
                entries: [...parsed[0].entries()]
              })
            )
        }
      });
    }

    setHeader(event, "content-type", "text/javascript");
    return serializeToStream(instance, result);
  } catch (x) {
    if (x instanceof Response && x.status === 302) {
      return new Response(null, {
        status: instance ? 204 : 302,
        headers: {
          Location: x.headers.get("Location")
        }
      });
    }
    return new Response(serializeToStream(instance, x), {
      status: 500,
      headers: {
        "Content-Type": "text/javascript",
        "x-server-function": "error"
      }
    });
  }
}

export default eventHandler(handleServerFunction);
