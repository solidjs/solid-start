import { useLocation } from "solid-start";

export default function A(props) {
  const location = useLocation();
  return (
    <a
      link
      href={props.href}
      classList={{
        [props.activeClass]: location.pathname === props.href
      }}
    >
      {props.children}
    </a>
  );
}
