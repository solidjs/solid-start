// @refresh skip
import {
  Errored,
  Show,
  createSignal,
  onSettled,
  type JSX,
} from "solid-js";
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
          pushError(error);
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
