import type { JSX } from "solid-js";
import { Text, type TextProps } from "./Text.tsx";

import './Section.css';

export interface SectionProps {
  title: string;
  options?: TextProps<'span'>['options'];
  children: JSX.Element;
}

export function Section(props: SectionProps): JSX.Element {
  return (
    <div data-start-section>
      <Text data-start-section-title options={{ weight: 'bold', font: 'sans', ...props.options }}>
        {props.title}
      </Text>
      <div data-start-section-content>
        {props.children}
      </div>
    </div>
  );
}
