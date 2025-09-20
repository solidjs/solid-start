import type { RouteSectionProps } from "@solidjs/router";

export default function(props: RouteSectionProps) {
  return <section>THING: {props.params.option || "NO"}</section>
}