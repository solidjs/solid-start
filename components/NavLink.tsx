import { useLocation } from "solid-start";

export default function NavLink(props) {
  const location = useLocation();
  return (
    <a
      href={props.href}
      classList={{
        [props.activeClass]: location.pathname === props.href
      }}
    >
      {props.children}
    </a>
  );
}
