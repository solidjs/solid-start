// @refresh reload
import { NavLink, useIsRouting } from "solid-app-router";
import { Suspense } from "solid-js";
import { Links, Meta, Outlet, Scripts } from "solid-start/components";
import "./index.css";
import "./styles.css";

export default function Root() {
  const isRouting = useIsRouting();

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <main>
          <style>{`
        .nav {
          margin-right: 5px;
          padding: 4px;
          text-decoration: none;
          display: inline-block;
          background-color: lightgray
        }
        .nav.is-active {
          font-weight: bold;
        }
        .list {
          padding: 4px;
          text-decoration: none;
          display: inline-block;
        }
      `}</style>
          <div class="global-loader" classList={{ "is-loading": isRouting() }}>
            <div class="global-loader-fill" />
          </div>
          <h1>Awesome Site</h1>
          <NavLink class="nav" href="/" end>
            Home
          </NavLink>
          <NavLink class="nav" href="/app/users?test=hi">
            Users
          </NavLink>
          <NavLink class="nav" href="/app/blog/a">
            Blog A
          </NavLink>
          <NavLink class="nav" href="/app/blog/b">
            Blog B
          </NavLink>
          <Suspense fallback="Loading">
            <Outlet />
          </Suspense>
        </main>
        <Scripts />
      </body>
    </html>
  );
}
