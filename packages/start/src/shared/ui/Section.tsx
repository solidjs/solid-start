import { Show, type JSX } from "solid-js";
import { Text, type TextProps } from "./Text.tsx";

import "./Section.css";

export interface SectionProps {
  title: string;
  options?: TextProps<"span">["options"];
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: JSX.Element;
}

export function Section(props: SectionProps): JSX.Element {
  return (
    <Show
      when={props.collapsible}
      fallback={
        <div data-start-section>
          <Text
            data-start-section-title
            options={{ weight: "bold", font: "sans", ...props.options }}
          >
            {props.title}
          </Text>
          <div data-start-section-content>{props.children}</div>
        </div>
      }
    >
      <details data-start-section open={props.defaultOpen ?? true}>
        <summary data-start-section-title>
          <Text options={{ weight: "bold", font: "sans", ...props.options }}>{props.title}</Text>
        </summary>
        <div data-start-section-content>{props.children}</div>
      </details>
    </Show>
  );
}
