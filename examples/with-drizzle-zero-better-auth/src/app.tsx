import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import Header from "~/components/header";
import "./app.css";
import { ZeroContext } from "./components/zero-context";
import { useAuthRedirect } from "./lib/use-auth-redirect";

export default function App() {
  return (
    <Router
      root={props => {
        useAuthRedirect();
        return (
          <ZeroContext>
            <Header />
            <Suspense>{props.children}</Suspense>
          </ZeroContext>
        );
      }}
    >
      <FileRoutes />
    </Router>
  );
}
