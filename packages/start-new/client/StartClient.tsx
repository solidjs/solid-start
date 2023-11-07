// @ts-ignore
import App from "#start/app";
import { Router } from "@solidjs/router";
import "./mount";

function Dummy(props) {
  return props.children;
}

export function StartClient() {
  return (
    <Router>
      <Dummy>
        <Dummy>
          <App />
        </Dummy>
      </Dummy>
    </Router>
  );
}
