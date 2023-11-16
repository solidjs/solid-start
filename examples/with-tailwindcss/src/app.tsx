// @refresh reload
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start";
import { Suspense } from "solid-js";
import Nav from "~/components/Nav";
import "./app.css";

export default function App() {
  return (
    <Suspense>
      <Router root={Nav}>
        <FileRoutes />
      </Router>
    </Suspense>
  );
}
