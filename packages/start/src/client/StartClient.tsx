// @refresh skip
// @ts-ignore
import App from "#start/app";
import type { JSX } from "solid-js";
import { ErrorBoundary } from "../shared/ErrorBoundary";
import "./mount";

function Dummy(props: { children: JSX.Element }) {
  return props.children;
}

export function StartClient() {
  return (
    <Dummy>
      <Dummy>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </Dummy>
    </Dummy>
  );
}
