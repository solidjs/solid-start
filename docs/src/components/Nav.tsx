import { NavLink } from "solid-app-router";

const Nav = () => {
  return (
    <nav class="gap-8 flex h-screen flex-col bg-gray-800 p-6">
      <NavLink end href="/" class="text-white" activeClass="text-gray-400">
        Home
      </NavLink>
      <NavLink href="/guides" class="text-white" activeClass="text-gray-400">
        Guides
      </NavLink>
      <NavLink href="/api" class="text-white" activeClass="text-gray-400">
        API
      </NavLink>
      <div class="flex-grow"></div>
      <a href="https://github.com/solidjs/solid-app-router" class="text-white">
        Solid App Router
      </a>
    </nav>
  );
};

export default Nav;
