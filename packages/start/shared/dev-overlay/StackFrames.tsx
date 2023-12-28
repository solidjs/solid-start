import type { JSX } from "solid-js";

export interface StackFramesProps {
  children?: JSX.Element;
}

export function StackFrames(props: StackFramesProps): JSX.Element {
  return (
    <div data-dev-overlay-stack-frames>
      {props.children}
    </div>
  );
}