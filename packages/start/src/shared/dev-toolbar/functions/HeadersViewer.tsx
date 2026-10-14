import { For } from "solid-js";
import { Text } from "../../ui/Text.tsx";

import "./HeadersViewer.css";

interface HeadersViewerProps {
  headers: Headers;
}

export function HeadersViewer(props: HeadersViewerProps) {
  return (
    <div data-start-headers-viewer data-start-kv-table>
      <For each={Array.from(props.headers.entries())}>
        {([key, value]) => (
          <div data-start-property data-start-kv-row>
            <Text
              data-start-kv-key
              options={{ size: "xs", weight: "semibold", font: "mono", wrap: "nowrap" }}
            >
              {key}
            </Text>
            <Text data-start-kv-value options={{ size: "xs", font: "mono", wrap: "wrap" }}>
              {value}
            </Text>
          </div>
        )}
      </For>
    </div>
  );
}
