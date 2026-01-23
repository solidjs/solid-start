import type { JSX } from 'solid-js';
import './Placeholder.css';

export interface PlaceholderProps {
  children?: JSX.Element;
}

export default function Placeholder(props: PlaceholderProps): JSX.Element {
  return (
    <div data-start-placeholder>
      {props.children}
    </div>
  );
}