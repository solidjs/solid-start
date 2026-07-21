import {
  createEffect,
  createSignal,
  ErrorBoundary,
  onCleanup,
  resetErrorBoundaries,
  Show,
  type JSX,
} from "solid-js";
import { createStore } from "solid-js/store";
import { Portal } from "solid-js/web";
import { Toolbar } from "terracotta";
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

  createEffect(() => {
    const current = ref();

    if (current) {
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

      onCleanup(() => {
        ac.abort();
      });
    }
  });

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
    resetErrorBoundaries();
  }

  function pushError(error: unknown) {
    console.error(error);
    setErrors(current => [error, ...current]);

    setContent("err");
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

  const [store, setStore] = createStore({
    instances: {} as Record<string, ServerFunctionInstance | undefined>,
  });

  createEffect(() => {
    onCleanup(
      captureServerFunctionCall(call => {
        console.log(call);
        if (call.type === "request") {
          setStore("instances", call.instance, value => {
            return {
              ...value,
              request: call,
            };
          });
        } else {
          setStore("instances", call.instance, value => {
            return {
              ...value,
              response: call,
            };
          });
        }
      }),
    );
  });

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
            instances={store.instances}
            onDeleteInstance={value => {
              setStore("instances", value, undefined);
            }}
          />
        </div>
      </Portal>
      <ErrorBoundary
        fallback={error => {
          pushError(error);
          return <HttpStatusCode code={500} />;
        }}
      >
        {props.children}
      </ErrorBoundary>
      <Show when={errors().length > 0}>
        <HttpStatusCode code={500} />
      </Show>
    </>
  );
}
