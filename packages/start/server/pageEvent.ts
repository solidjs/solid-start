import {
  getCookie,
  setCookie
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
  ctx.response.headers.set("Cache-Control", "no-cache");
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
    // prevUrl: prevPath || "",
    // mutation: mutation,
    // $type: FETCH_EVENT,
    $islands: new Set<string>()
  });

  return pageEvent;
}
