import { createMemo, createResource, type JSX, onCleanup, Show, Suspense } from 'solid-js';

import { Badge } from "../ui/Badge";
import Button from "../ui/Button";

import './BlobViewer.css';


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

interface BlobViewerInnerProps {
  source: File | Blob;
}

function BlobViewerInner(props: BlobViewerInnerProps): JSX.Element {
  const fileURL = createMemo(() => URL.createObjectURL(props.source));

  onCleanup(() => {
    URL.revokeObjectURL(fileURL());
  });

  function openFileInNewTab() {
    const link = document.createElement("a");
    link.href = fileURL();
    link.target = "_blank"; // Open in a new tab
    link.style.display = "none"; // Hide the link
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <Button data-start-blob-viewer onClick={() => openFileInNewTab()}>
      {props.source instanceof File
        ? (
          <Badge type="info">
            <DocumentIcon title={props.source.name} />
            {props.source.name}
          </Badge>
        )
        : <Badge type="info">{props.source.type}</Badge>
      }
    </Button>
  )
}


export interface BlobViewerProps {
  source: Blob | File | Promise<Blob | File>;
}


export function BlobViewer(props: BlobViewerProps): JSX.Element {
  const [data] = createResource(() => props.source);

  return (
    <Suspense>
      <Show when={data()}>
        {(current) => <BlobViewerInner source={current()} />}
      </Show>
    </Suspense>
  );
}
