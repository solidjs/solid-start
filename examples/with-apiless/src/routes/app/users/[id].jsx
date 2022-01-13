import { Outlet, NavLink } from "solid-app-router";

export default function User() {
  return (
    <>
      <h2>User</h2>
      <NavLink class="nav" href="" end>
        About
      </NavLink>
      <NavLink class="nav" href="settings">
        Settings
      </NavLink>
      <NavLink class="nav" href="other">
        Special
      </NavLink>
      <Outlet />
    </>
  );
}
