import { createResource, For, type JSX, Show, Suspense } from "solid-js";
import { Section } from "../../ui/Section.tsx";
import { Text } from "../../ui/Text.tsx";

interface URLSearchParamsViewerInnerProps {
  source: URLSearchParams;
}

function URLSearchParamsViewerInner(props: URLSearchParamsViewerInnerProps): JSX.Element {
  return (
    <Section title="URLSearchParams" options={{ size: "sm" }}>
      <div data-start-properties data-start-kv-table>
        <For each={Array.from(props.source.entries())}>
          {([key, value]) => (
            <div data-start-property data-start-kv-row>
              <Text
                data-start-kv-key
                options={{ size: "xs", weight: "semibold", font: "mono", wrap: "nowrap" }}
              >
                {key}
              </Text>
              <Text data-start-kv-value options={{ size: "xs", font: "mono", wrap: "wrap" }}>
                {JSON.stringify(value)}
              </Text>
            </div>
          )}
        </For>
      </div>
    </Section>
  );
}

export interface URLSearchParamsViewerProps {
  source: URLSearchParams | Promise<URLSearchParams>;
}

export function URLSearchParamsViewer(props: URLSearchParamsViewerProps) {
  const [data] = createResource(() => props.source);

  return (
    <Suspense>
      <Show when={data()}>{current => <URLSearchParamsViewerInner source={current()} />}</Show>
    </Suspense>
  );
}
