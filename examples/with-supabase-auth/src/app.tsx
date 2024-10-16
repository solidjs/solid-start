import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { Navigation } from "~/components/navigation";
import "./app.css";

export default function App() {
  return (
    <Router
      root={props => (
        <>
          <Navigation />
          <Suspense>{props.children}</Suspense>
        </>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
