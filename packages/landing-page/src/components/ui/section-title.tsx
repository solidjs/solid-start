import { type JSX } from "solid-js";
import { cn } from "~/lib/utils";

interface Props {
  stylesOverride?: string;
  children: JSX.Element;
}

const DEFAULT_STYLES = "text-3xl text-center text-sky-800 dark:text-sky-200/80 px-2";

export function SectionTitle(props: Props) {
  return <h2 class={cn(DEFAULT_STYLES, props.stylesOverride)}>{props.children}</h2>;
}
