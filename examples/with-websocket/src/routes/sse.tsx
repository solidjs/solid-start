import { createEffect, createSignal, onCleanup } from "solid-js";
import server$, { eventStream } from "solid-start/server";

function createEventStream({ url }: { url: string }, onMessage: (ev: MessageEvent) => void) {
  createEffect(() => {
    const eventSource = new EventSource(url);

    eventSource.addEventListener("chat", event => {
      onMessage(event);
    });

    onCleanup(() => eventSource.close());
  });
}

export default function Page() {
  let [state, setState] = createSignal("test data");
  createEventStream(
    server$(async function () {
      return eventStream(server$.request, send => {
        send("chat", "Hello world");
        setTimeout(() => {
          send("chat", "Goodbye");
        }, 2000);
        return () => {};
      });
    }),
    event => {
      setState(event.data);
    }
  );

  return <h1 id="chat">{state()}</h1>;
}
