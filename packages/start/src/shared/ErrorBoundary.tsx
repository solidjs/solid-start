// @refresh skip
import { catchError, ErrorBoundary as DefaultErrorBoundary, type ParentProps } from "solid-js";
import { isServer } from "solid-js/web";
import clientOnly from "./clientOnly.ts";
import { HttpStatusCode } from "./HttpStatusCode.ts";

const DevToolbar = clientOnly(
  () => import("./dev-toolbar/index.tsx").then(({ DevToolbar }) => ({ default: DevToolbar })),
  { lazy: true },
);

export const ErrorBoundary =
  import.meta.env.DEV && import.meta.env.START_DEV_OVERLAY
    ? (props: ParentProps) => <DevToolbar>{props.children}</DevToolbar>
    : (props: ParentProps) => {
        const message = isServer
          ? "500 | Internal Server Error"
          : "Error | Uncaught Client Exception";
        return (
          <DefaultErrorBoundary
            fallback={error => {
              console.error(error);
              return (
                <>
                  <span style="font-size:1.5em;text-align:center;position:fixed;left:0px;bottom:55%;width:100%;">
                    {message}
                  </span>
                  <HttpStatusCode code={500} />
                </>
              );
            }}
          >
            {props.children}
          </DefaultErrorBoundary>
        );
      };

export const TopErrorBoundary = (props: ParentProps) => {
  let isError = false;
  const res = catchError(
    () => props.children,
    err => {
      console.error(err);
      isError = !!err;
    },
  );
  return isError ? (
    <>
      <span style="font-size:1.5em;text-align:center;position:fixed;left:0px;bottom:55%;width:100%;">
        500 | Internal Server Error
      </span>
      <HttpStatusCode code={500} />
    </>
  ) : (
    res
  );
};
