// @refresh reload
import { type RouteDefinition, Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { querySession } from "./lib";
import Session from "./lib/Context";
import Nav from "./components/Nav";
import "./app.css";

export const route: RouteDefinition = {
  preload: ({ location }) => querySession(location.pathname)
};

export default function App() {
  return (
    <Router
      root={props => (
        <Session>
          <Suspense>
            <Nav />
            {props.children}
          </Suspense>
        </Session>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
