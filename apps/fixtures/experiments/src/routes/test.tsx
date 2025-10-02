import { RouteSectionProps } from "@solidjs/router";

export default function (props: RouteSectionProps) {
  return (
    <>
      <h1>Layout</h1>
      {props.children}
    </>
  );
}
