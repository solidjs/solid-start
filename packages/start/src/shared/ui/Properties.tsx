import { For, type JSX } from 'solid-js';
import { Text } from './Text.tsx';
import './Properties.css';

export type PropertyEntry = [key: unknown, value: unknown];

export interface PropertiesProps<T extends PropertyEntry> {
  entries: T[];

  renderKey: (key: T[0]) => JSX.Element;
  renderValue: (value: T[1]) => JSX.Element;
}

export function Properties<T extends PropertyEntry>(
  props: PropertiesProps<T>,
): JSX.Element {
  return (
    <div data-start-properties>
      <For each={props.entries}>
        {(entry) => (
          <div data-start-property>
            {props.renderKey(entry[0])}
            {props.renderValue(entry[1])}
          </div>
        )}
      </For>
    </div>
  );
}

export function PropertySeparator() {
  return <Text options={{ size: 'xs', weight: 'semibold', wrap: 'nowrap' }}>:</Text>;
}
