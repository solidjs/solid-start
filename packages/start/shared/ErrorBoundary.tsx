import {
  ParentProps
} from "solid-js";
import { DevOverlay } from "./dev-overlay";

export function ErrorBoundary(props: ParentProps) {
  return (
    <DevOverlay>
      {props.children}
    </DevOverlay>
  );
}
