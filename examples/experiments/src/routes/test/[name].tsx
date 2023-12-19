import { RouteSectionProps } from "@solidjs/router";

export default function(props: RouteSectionProps) {
  return <section>{props.params.name}</section>
}