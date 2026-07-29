import { createMemo, For, Loading, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { Section } from "../../ui/Section.tsx";
import { BlobViewer } from "./BlobViewer.tsx";
import { PropertySeparator, SerovalValue } from "./SerovalValue.tsx";

interface FormDataViewerInnerProps {
  source: FormData;
}

function FormDataViewerInner(props: FormDataViewerInnerProps): JSX.Element {
  return (
    <Section title="FormData" options={{ size: "sm" }}>
      <div data-start-form-data-viewer data-start-properties>
        <For each={Array.from(props.source.entries())}>
          {([key, value]) => (
            <div data-start-property>
              <SerovalValue value={`"${key}"`} />
              <PropertySeparator />
              {typeof value === "string" ? (
                <SerovalValue value={`"${JSON.stringify(value)}"`} />
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
  const data = createMemo(async () => await props.source);

  return (
    <Loading>
      <Show when={data()} keyed>{current => <FormDataViewerInner source={current} />}</Show>
    </Loading>
  );
}
