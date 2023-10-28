// @ts-ignore
import App from "#start/app";
import { Router } from "@solidjs/router";
import { PageEvent } from "../server/types";

import { createRoutes } from "../shared/FileRoutes";
import { ServerContext } from "../shared/ServerContext";
import "./mount";

const routes = createRoutes();

function Dummy(props) {
  return props.children;
}

export function StartClient() {
  return (
    <ServerContext.Provider value={{ routes } as unknown as PageEvent}>
      <Router>
        <Dummy>
          <Dummy>
            <App />
          </Dummy>
        </Dummy>
      </Router>
    </ServerContext.Provider>
  );
}