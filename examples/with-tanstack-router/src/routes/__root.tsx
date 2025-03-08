import { Link, Outlet, createRootRoute } from "@tanstack/solid-router";

import { clientOnly } from "@solidjs/start";
import { Suspense } from "solid-js";


const Devtools = clientOnly(() => import("../components/Devtools"));

export const Route = createRootRoute({
  component: RootComponent
});

function RootComponent() {
  return (
    <>
      <Link to="/">Index</Link>
      <Link to="/about">About</Link>
      <Suspense>
        <Outlet />
        <Devtools />
      </Suspense>
    </>
  );
}
