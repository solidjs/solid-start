import { HttpHeader } from "@solidjs/start";

export default function HttpHeaderRoute() {
  return (
    <main>
      <h1>Http Header</h1>
      <HttpHeader name="test-header" value="test-value" />
    </main>
  );
}
