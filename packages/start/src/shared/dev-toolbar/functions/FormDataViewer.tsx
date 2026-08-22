import { createResource, For, type JSX, Show, Suspense } from "solid-js";
import { Section } from "../../ui/Section.tsx";
import { Text } from "../../ui/Text.tsx";
import { BlobViewer } from "./BlobViewer.tsx";

interface FormDataViewerInnerProps {
  source: FormData;
}

function FormDataViewerInner(props: FormDataViewerInnerProps): JSX.Element {
  return (
    <Section title="FormData" options={{ size: "sm" }}>
      <div data-start-form-data-viewer data-start-kv-table>
        <For each={Array.from(props.source.entries())}>
          {([key, value]) => (
            <div data-start-property data-start-kv-row>
              <Text
                data-start-kv-key
                options={{ size: "xs", weight: "semibold", font: "mono", wrap: "nowrap" }}
              >
                {key}
              </Text>
              {typeof value === "string" ? (
                <Text data-start-kv-value options={{ size: "xs", font: "mono", wrap: "wrap" }}>
                  {JSON.stringify(value)}
                </Text>
              ) : (
                <BlobViewer source={value} />
              )}
            </div>
          )}
        </For>
      </div>
    </Section>
  );
}

export interface FormDataViewerProps {
  source: FormData | Promise<FormData>;
}

export function FormDataViewer(props: FormDataViewerProps) {
  const [data] = createResource(() => props.source);

  return (
    <Suspense>
      <Show when={data()}>{current => <FormDataViewerInner source={current()} />}</Show>
    </Suspense>
  );
}
