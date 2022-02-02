import { NavLink } from "solid-app-router";

const Nav = () => {
  return (
    <nav class="flex items-center gap-8 flex-wrap bg-gray-800 p-6">
      <NavLink end href="/" class="text-white" activeClass="text-gray-400">
        Home
      </NavLink>
      <NavLink href="/guides" class="text-white" activeClass="text-gray-400">
        Guides
      </NavLink>
    </nav>
  );
};

export default Nav;
