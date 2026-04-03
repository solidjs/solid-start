import { createResource, For, type JSX, Show, Suspense } from 'solid-js';
import { Section } from '../ui/Section.tsx';
import { PropertySeparator, SerovalValue } from './SerovalValue.tsx';

interface URLSearchParamsViewerInnerProps {
  source: URLSearchParams;
}

function URLSearchParamsViewerInner(props: URLSearchParamsViewerInnerProps): JSX.Element {
  return (
    <Section title="URLSearchParams" options={{ size: 'sm' }}>
      <div data-start-properties>
        <For each={Array.from(props.source.entries())}>
          {([key, value]) => (
            <div data-start-property>
              <SerovalValue value={`"${key}"`} />
              <PropertySeparator />
              <SerovalValue value={`"${JSON.stringify(value)}"`} />
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
      <Show when={data()}>
        {(current) => <URLSearchParamsViewerInner source={current()} />}
      </Show>
    </Suspense>
  );
}