import {
  appendResponseHeader,
  getCookie,
  getResponseHeader,
  removeResponseHeader,
  setCookie,
  setResponseHeader,
  setResponseStatus
} from "vinxi/server";
import { createRoutes } from "../shared/FileRoutes";
import { FetchEvent, PageEvent } from "./types";

function initFromFlash(ctx: FetchEvent) {
  const flash = getCookie(ctx, "flash");
  if (!flash) return;
  let param = JSON.parse(flash);
  if (!param || !param.result) return [];
  const input = [...param.input.slice(0, -1), new Map(param.input[param.input.length - 1])];
  setCookie(ctx, "flash", "", { maxAge: 0 });
  return {
    url: param.url,
    result: param.error ? new Error(param.result) : param.result,
    input
  };
}

export async function createPageEvent(ctx: FetchEvent) {
  const clientManifest = import.meta.env.MANIFEST["client"];
  const serverManifest = import.meta.env.MANIFEST["ssr"];
  setResponseHeader(ctx, "Content-Type", "text/html");
  // const prevPath = ctx.request.headers.get("x-solid-referrer");
  // const mutation = ctx.request.headers.get("x-solid-mutation") === "true";
  const pageEvent: PageEvent = Object.assign(ctx, {
    manifest: await clientManifest.json(),
    assets: [
      ...(await clientManifest.inputs[clientManifest.handler].assets()),
      ...(import.meta.env.START_ISLANDS
        ? (await serverManifest.inputs[serverManifest.handler].assets()).filter(
            s => (s as any).attrs.rel !== "modulepreload"
          )
        : [])
    ],
    initialSubmission: initFromFlash(ctx),
    routes: createRoutes(),
    components: {
      status: props => {
        setResponseStatus(ctx, props.code, props.text);
        return () => !ctx.nativeEvent.handled && setResponseStatus(ctx, 200);
      },
      header: props => {
        if (props.append) {
          appendResponseHeader(ctx, props.name, props.value);
        } else {
          setResponseHeader(ctx, props.name, props.value);
        }

        return () => {
          if (ctx.nativeEvent.handled) return;
          let values = getResponseHeader(ctx, props.name);
          if (!Array.isArray(values)) values = [values as string];
          const index = values.indexOf(props.value);
          index !== -1 && values.splice(index, 1);
          if (values.length) setResponseHeader(ctx, props.name, values);
          else removeResponseHeader(ctx, props.name);
        };
      }
    },
    // prevUrl: prevPath || "",
    // mutation: mutation,
    // $type: FETCH_EVENT,
    $islands: new Set<string>()
  });

  return pageEvent;
}
