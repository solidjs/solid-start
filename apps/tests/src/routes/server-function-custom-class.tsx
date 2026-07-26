import { createEffect, createSignal } from "solid-js";
import { ObjectId } from "../utils/object-id.ts";

/**
 * Exercises `serialization.plugins`: a class Seroval has no built-in support
 * for has to survive both directions of a server function call.
 *
 * @see https://github.com/solidjs/solid-start/issues/1474
 */
async function echoObjectId(id: ObjectId) {
  "use server";

  return {
    receivedInstance: id instanceof ObjectId,
    receivedHex: id.toHexString(),
    returned: new ObjectId("507f1f77bcf86cd799439011"),
  };
}

export default function App() {
  const [output, setOutput] = createSignal<Record<string, unknown>>({});

  createEffect(async () => {
    const result = await echoObjectId(new ObjectId("507f191e810c19729de860ea"));

    setOutput({
      receivedInstance: result.receivedInstance,
      receivedHex: result.receivedHex,
      returnedInstance: result.returned instanceof ObjectId,
      returnedHex: result.returned.toHexString(),
    });
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
