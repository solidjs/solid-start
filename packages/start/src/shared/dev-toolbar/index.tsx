import { createEffect, createSignal, Errored, onSettled, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { Portal } from "@solidjs/web";
import { Toolbar } from "terracotta/toolbar";
import info from "../../../package.json" with { type: "json" };
import clientOnly from "../clientOnly.ts";
import { HttpStatusCode } from "../HttpStatusCode.ts";
import IconButton from "../ui/IconButton.tsx";
import { Text } from "../ui/Text.tsx";
import { type ServerFunctionInstance, ServerFunctionViewer } from "./functions/index.tsx";
import { captureServerFunctionCall } from "./functions/tracker.ts";
import { ErrorIcon, FunctionIcon, SolidStartIcon } from "./icons.tsx";
import "./index.css";

const ErrorViewer = import.meta.env.PROD
  ? () => <></>
  : clientOnly(() => import("./error-viewer/index.tsx"), { lazy: true });

export interface DevToolbarProps {
  children?: JSX.Element;
}

export function DevToolbar(props: DevToolbarProps) {
  const [ref, setRef] = createSignal<HTMLElement>();

  createEffect(
    () => ref(),
    current => {
      if (!current) return;
      let isDown = false;

      // Offsets of the mouse relatively to the element's position
      let offsetX = 0;
      let offsetY = 0;

      let currentX = 0;
      let currentY = 0;

      let centerX = 0;
      let centerY = 0;

      const resetPosition = () => {
        current.style.top = "auto";
        current.style.left = "auto";
        current.style.bottom = "auto";
        current.style.right = "auto";
      };

      let isDirty = false;

      const ac = new AbortController();

      current.addEventListener(
        "mousedown",
        e => {
          isDown = true;

          const rect = current.getBoundingClientRect();

          currentX = rect.left;
          currentY = rect.top;

          offsetX = e.clientX - currentX;
          offsetY = e.clientY - currentY;

          centerX = rect.width / 2;
          centerY = rect.height / 2;

          isDirty = true;
        },
        {
          signal: ac.signal,
        },
      );

      window.addEventListener(
        "mouseup",
        () => {
          if (isDown && !isDirty) {
            const preferredAnchorX = currentX + centerX < window.innerWidth / 2 ? "left" : "right";
            const preferredAnchorY = currentY + centerY < window.innerHeight / 2 ? "top" : "bottom";

            resetPosition();

            current.style[preferredAnchorX] = "0px";
            current.style[preferredAnchorY] = "0px";

            current.style.flexDirection =
              preferredAnchorY === "bottom" ? "column-reverse" : "column";
            current.style.alignItems = preferredAnchorX === "left" ? "flex-start" : "flex-end";
          }
          isDown = false;
        },
        {
          signal: ac.signal,
        },
      );

      window.addEventListener(
        "mousemove",
        e => {
          if (isDown) {
            if (isDirty) {
              resetPosition();
              isDirty = false;
            }
            currentX = e.clientX - offsetX;
            currentY = e.clientY - offsetY;

            current.style.left = `${currentX}px`;
            current.style.top = `${currentY}px`;
          }
        },
        {
          signal: ac.signal,
          passive: true,
        },
      );

      return () => {
        ac.abort();
      };
    },
  );

  const [content, setContent] = createSignal<"fn" | "err" | undefined>(undefined);

  function toggleContent(value: "fn" | "err") {
    if (content() === value) {
      setContent(undefined);
    } else {
      setContent(value);
    }
  }

  const [errors, setErrors] = createSignal<unknown[]>([]);

  function resetError() {
    setErrors([]);
  }

  function pushError(error: unknown) {
    console.error(error);
    setErrors(current => [error, ...current]);

    setContent("err");
  }

  onSettled(() => {
    const onErrorEvent = (error: ErrorEvent) => {
      // Browsers dispatch benign ResizeObserver loop notifications as window
      // "error" events carrying no error object. They aren't app errors.
      if (!error.error && error.message?.startsWith("ResizeObserver loop")) {
        return;
      }
      pushError(error.error ?? error);
    };

    window.addEventListener("error", onErrorEvent);

    return () => {
      window.removeEventListener("error", onErrorEvent);
    };
  });

  // A plain record behind a signal, not a store: the captured values hold
  // native Request/Response objects, whose methods break when reached through
  // a store proxy (`this` becomes the proxy — "Illegal invocation").
  const [instances, setInstances] = createSignal<
    Record<string, ServerFunctionInstance | undefined>
  >({});

  onSettled(() =>
    captureServerFunctionCall(call => {
      // The tracker fires synchronously inside the transport, which may be
      // running in an owned scope (e.g. a router preload computation) where
      // signal writes are not allowed — defer the write out of it.
      queueMicrotask(() => {
        setInstances(current => ({
          ...current,
          [call.instance]:
            call.type === "request"
              ? { ...current[call.instance], request: call }
              : ({ ...current[call.instance], response: call } as ServerFunctionInstance),
        }));
      });
    }),
  );

  return (
    <>
      <Portal>
        <div data-start-dev-toolbar ref={setRef}>
          <Toolbar>
            <div>
              <IconButton onClick={() => toggleContent("err")} disabled={errors().length === 0}>
                <ErrorIcon title="View Errors" />
              </IconButton>
              <IconButton onClick={() => toggleContent("fn")}>
                <FunctionIcon title="View Server Functions" />
              </IconButton>
            </div>
            <div>
              <SolidStartIcon title="Solid Start Version" />
              <div data-start-dev-toolbar-version>
                <Text options={{ size: "xs", weight: "semibold", font: "mono", wrap: "nowrap" }}>
                  {info.version as string}
                </Text>
              </div>
            </div>
          </Toolbar>
          <ErrorViewer show={content() === "err"} errors={errors()} resetError={resetError} />
          <ServerFunctionViewer
            show={content() === "fn"}
            instances={instances()}
            onDeleteInstance={value => {
              setInstances(current => {
                const next = { ...current };
                delete next[value];
                return next;
              });
            }}
          />
        </div>
      </Portal>
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
      <Show when={errors().length > 0}>
        <HttpStatusCode code={500} />
      </Show>
    </>
  );
}
