import { MetaProvider } from "@solidjs/meta";
import { FileRoutes } from "@solidjs/start/router";
import { Router } from "@solidjs/router";
import { Suspense } from "solid-js";

import "./app.css";

export default function App() {
  return (
    <Suspense>
      <MetaProvider>
        <Router>
          <FileRoutes />
        </Router>
      </MetaProvider>
    </Suspense>
  );
}
