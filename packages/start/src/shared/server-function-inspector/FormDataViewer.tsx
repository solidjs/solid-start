import { createResource, For, Show, Suspense, type JSX } from 'solid-js';

import { SerovalValue } from './SerovalValue.tsx';
import { PropertySeparator } from '../ui/Properties.tsx';
import { Section } from '../ui/Section';
import Button from '../ui/Button';
import { Badge } from '../ui/Badge.tsx';


import './FormDataViewer.css';

function DocumentIcon(
  props: JSX.IntrinsicElements["svg"] & { title: string },
): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <title>{props.title}</title>
      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

interface FormDataViewerInnerProps {
  source: FormData;
}

function FormDataViewerInner(props: FormDataViewerInnerProps): JSX.Element {
  function openFileInNewTab(file: File) {
    const fileURL = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = fileURL;
    link.target = "_blank"; // Open in a new tab
    link.style.display = "none"; // Hide the link
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <Section title="FormData" options={{ size: 'sm' }}>
      <div data-start-form-data-viewer data-start-seroval-properties>
        <For each={Array.from(props.source.entries())}>
          {([key, value]) => (
            <div data-start-seroval-property>
              <SerovalValue value={`"${key}"`} />
              <PropertySeparator />
              {typeof value === 'string'
                ? <SerovalValue value={JSON.stringify(value)} />
                : (
                  <Button onClick={() => openFileInNewTab(value)}>
                    <Badge type="info">
                      <DocumentIcon title={value.name} />
                      {value.name}
                    </Badge>
                  </Button>
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
      <Show when={data()}>
        {(current) => <FormDataViewerInner source={current()} />}
      </Show>
    </Suspense>
  );
}