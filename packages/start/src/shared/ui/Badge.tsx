import type { JSX } from 'solid-js';
import './Badge.css';
import { Text } from './Text.tsx';


export interface BadgeProps {
  value: string | number;
  type: 'info' | 'success' | 'failure' | 'warning';
}

export function Badge(props: BadgeProps): JSX.Element {
  return (
    <Text options={{ size: 'xs', wrap: 'nowrap', weight: 'semibold' }} data-start-badge={props.type}>
      {props.value}
    </Text>
  );
}
