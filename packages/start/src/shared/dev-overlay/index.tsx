// @refresh skip
import {
  ErrorBoundary,
  Show,
  createEffect,
  createSignal,
  onCleanup,
  resetErrorBoundaries,
  type JSX
} from "solid-js";
import { HttpStatusCode } from "../HttpStatusCode.js";
import clientOnly from "../clientOnly.js";

export interface DevOverlayProps {
  children?: JSX.Element;
}

const DevOverlayDialog = import.meta.env.PROD
  ? () => <></>
  : clientOnly(() => import("./DevOverlayDialog.jsx"), { lazy: true });

export function DevOverlay(props: DevOverlayProps): JSX.Element {
  const [errors, setErrors] = createSignal<unknown[]>([]);

  function resetError() {
    setErrors([]);
    resetErrorBoundaries();
  }

  function pushError(error: unknown) {
    console.error(error);
    setErrors(current => [error, ...current]);
  }

  createEffect(() => {
    const onErrorEvent = (error: ErrorEvent) => {
      pushError(error.error ?? error);
    };

    window.addEventListener("error", onErrorEvent);

    onCleanup(() => {
      window.removeEventListener("error", onErrorEvent);
    });
  });

  return (
    <>
      <ErrorBoundary
        fallback={error => {
          pushError(error);
          return <HttpStatusCode code={500} />;
        }}
      >
        {props.children}
      </ErrorBoundary>
      <Show when={errors().length}>
        <HttpStatusCode code={500} />
        <DevOverlayDialog errors={errors()} resetError={resetError} />
      </Show>
    </>
  );
}
