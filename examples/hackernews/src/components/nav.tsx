import { Link } from "solid-app-router";

function Nav() {
  return (
    <header class="header" $ServerOnly>
      <nav class="inner">
        <Link href="/">
          <strong $ServerOnly>HN</strong>
        </Link>
        <Link href="/new">
          <strong $ServerOnly>New</strong>
        </Link>
        <Link href="/show">
          <strong $ServerOnly>Show</strong>
        </Link>
        <Link href="/ask">
          <strong $ServerOnly>Ask</strong>
        </Link>
        <Link href="/job">
          <strong $ServerOnly>Jobs</strong>
        </Link>
        <a class="github" href="http://github.com/solidjs/solid" target="_blank" rel="noreferrer">
          Built with Solid
        </a>
      </nav>
    </header>
  );
}

export default Nav;
