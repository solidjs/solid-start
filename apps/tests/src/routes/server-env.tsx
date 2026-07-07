import { SERVER_EXAMPLE } from "env:server";
import env from "env:server/runtime";
import { createEffect, createSignal } from "solid-js";

async function getServerCompiledEnv() {
  "use server";

  return await Promise.resolve(SERVER_EXAMPLE);
}

async function getServerRuntimeEnv() {
  "use server";

  return await Promise.resolve(env.NODE_ENV);
}

async function checkServerEnvOnClient() {
  try {
    await import("env:server");
    return false;
  } catch {
    return true;
  }
}

export default function App() {
  const [output, setOutput] = createSignal<{ result?: boolean }>({});

  createEffect(async () => {
    const resultA = await getServerCompiledEnv();
    const resultB = await getServerRuntimeEnv();
    const checkImport = await checkServerEnvOnClient();
    setOutput(prev => ({ ...prev, result: !!resultA && !!resultB && checkImport }));
  });

  return (
    <main>
      <span id="server-fn-test">{JSON.stringify(output())}</span>
    </main>
  );
}
