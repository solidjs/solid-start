// @ts-ignore
import App from "#start/app";
import { ErrorBoundary } from "../shared/ErrorBoundary";
import "./mount";

function Dummy(props) {
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
