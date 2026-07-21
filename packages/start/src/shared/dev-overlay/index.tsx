// @refresh skip
import { Errored, Show, createSignal, onSettled } from "solid-js";
import type { JSX } from "@solidjs/web";
import clientOnly from "../clientOnly.ts";
import { HttpStatusCode } from "../HttpStatusCode.ts";

export interface DevOverlayProps {
  children?: JSX.Element;
}

const DevOverlayDialog = import.meta.env.PROD
  ? () => <></>
  : clientOnly(() => import("./DevOverlayDialog"), { lazy: true });

export function DevOverlay(props: DevOverlayProps): JSX.Element {
  const [errors, setErrors] = createSignal<unknown[]>([]);

  function resetError() {
    setErrors([]);
  }

  function pushError(error: unknown) {
    console.error(error);
    setErrors(current => [error, ...current]);
  }

  onSettled(() => {
    const onErrorEvent = (error: ErrorEvent) => {
      pushError(error.error ?? error);
    };

    window.addEventListener("error", onErrorEvent);

    return () => {
      window.removeEventListener("error", onErrorEvent);
    };
  });

  return (
    <>
      <Errored
        fallback={error => {
          // `error` is an accessor in Solid 2, and signal writes are not
          // allowed inside the boundary's owned scope, so defer the push.
          const err = error();
          queueMicrotask(() => pushError(err));
          return <HttpStatusCode code={500} />;
        }}
      >
        {props.children}
      </Errored>
      <Show when={errors().length}>
        <HttpStatusCode code={500} />
        <DevOverlayDialog errors={errors()} resetError={resetError} />
      </Show>
    </>
  );
}
