import { Link } from "solid-app-router";

const Nav = () => {
  return (
    <nav class="flex items-center gap-8 flex-wrap bg-gray-800 p-6">
      <Link href="/" class="text-white">
        Home
      </Link>
      <Link href="/guides" class="text-white">
        Guides
      </Link>
    </nav>
  );
};

export default Nav;
