import { RouteSectionProps } from "@solidjs/router";

export default function(props: RouteSectionProps) {
  return <>
    <h1>Group</h1>
    {props.children}
  </>
}