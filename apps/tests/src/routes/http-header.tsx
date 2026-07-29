import { createAsync, query } from "@solidjs/router";
import { HttpHeader } from "@solidjs/start";
import { Show } from "solid-js";
import { setTimeout } from "timers/promises";

const getData = query(async () => {
  "use server";
  await setTimeout(500);

  return "async-value";
}, "http-header");

export default function HttpHeaderRoute() {
  const data = createAsync(() => getData(), { deferStream: true });

  return (
    <main>
      <h1>Http Header</h1>
      <HttpHeader name="test-header" value="test-value" />
      <Show when={data()}>{value => <HttpHeader name="test-header-async" value={value()} />}</Show>
    </main>
  );
}
