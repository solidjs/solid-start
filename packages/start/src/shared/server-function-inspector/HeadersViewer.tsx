import { For } from "solid-js";
import { PropertySeparator, SerovalValue } from "./SerovalValue.tsx";

import './HeadersViewer.css';
import { Text } from "../ui/Text.tsx";

interface HeadersViewerProps {
  headers: Headers;
}

export function HeadersViewer(props: HeadersViewerProps) {
  return (
    <div data-start-headers-viewer data-start-properties>
      <For each={Array.from(props.headers.entries())}>
        {([key, value]) => (
          <div data-start-property>
            <Text options={{ size: 'xs', weight: 'semibold', wrap: 'nowrap' }}>{key}</Text>
            <PropertySeparator />
            <SerovalValue value={value} />
          </div>
        )}
      </For>
    </div >
  );
}
