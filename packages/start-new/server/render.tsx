import { renderToStream } from "solid-js/web";
import { FetchEvent, PageEvent } from "./types";

export function renderStream(
  fn: (context: PageEvent) => unknown,
  options?: {
    nonce?: string;
    renderId?: string;
    timeoutMs?: number;
    createPageEvent: (event: FetchEvent) => Promise<PageEvent>;
  }
) {
  return () => {
    return async event => {
      const context = await options.createPageEvent(event);
      const stream = renderToStream(() => fn(context), options);
      if (context.routerContext && context.routerContext.url) {
        return event.redirect(context.routerContext.url);
      }
      return { pipeTo: stream.pipeTo };
    };
  };
}
