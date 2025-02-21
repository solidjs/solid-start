import { Link, Outlet, createRootRoute } from "@tanstack/solid-router";
import { Suspense } from "solid-js";

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
      </Suspense>
    </>
  );
}
