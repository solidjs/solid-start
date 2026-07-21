// @refresh skip
import { Errored, type ParentProps } from "solid-js";
import { isServer } from "@solidjs/web";
import { HttpStatusCode } from "./HttpStatusCode.ts";
import { DevOverlay } from "./dev-overlay/index.tsx";

export const ErrorBoundary =
  import.meta.env.DEV && import.meta.env.START_DEV_OVERLAY
    ? (props: ParentProps) => <DevOverlay>{props.children}</DevOverlay>
    : (props: ParentProps) => {
        const message = isServer
          ? "500 | Internal Server Error"
          : "Error | Uncaught Client Exception";
        return (
          <Errored
            fallback={(error: any) => {
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
          </Errored>
        );
      };

export const TopErrorBoundary = (props: ParentProps) => {
  return (
    <Errored
      fallback={(err: any) => {
        console.error(err);
        return (
          <>
            <span style="font-size:1.5em;text-align:center;position:fixed;left:0px;bottom:55%;width:100%;">
              500 | Internal Server Error
            </span>
            <HttpStatusCode code={500} />
          </>
        );
      }}
    >
      {props.children}
    </Errored>
  );
};
