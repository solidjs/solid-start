import { createResource, For, type JSX, Show, Suspense } from 'solid-js';
import { Section } from '../ui/Section';
import { BlobViewer } from './BlobViewer.tsx';
import { SerovalValue, PropertySeparator } from './SerovalValue.tsx';

interface FormDataViewerInnerProps {
  source: FormData;
}

function FormDataViewerInner(props: FormDataViewerInnerProps): JSX.Element {
  return (
    <Section title="FormData" options={{ size: 'sm' }}>
      <div data-start-form-data-viewer data-start-properties>
        <For each={Array.from(props.source.entries())}>
          {([key, value]) => (
            <div data-start-property>
              <SerovalValue value={`"${key}"`} />
              <PropertySeparator />
              {typeof value === 'string'
                ? <SerovalValue value={`"${JSON.stringify(value)}"`} />
                : <BlobViewer source={value} />}
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
      <Show when={data()}>
        {(current) => <FormDataViewerInner source={current()} />}
      </Show>
    </Suspense>
  );
}