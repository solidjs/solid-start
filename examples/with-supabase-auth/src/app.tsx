import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { Navigation } from "~/components/navigation";
import "./app.css";
import { SupabaseSessionProvider } from "./util/supabase/session-context";

export default function App() {
  return (
    <Router
      root={props => (
        <SupabaseSessionProvider>
          <Navigation />
          <Suspense>{props.children}</Suspense>
        </SupabaseSessionProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
