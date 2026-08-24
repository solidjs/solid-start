import { createMemo, createResource, type JSX, onCleanup, Show, Suspense } from "solid-js";

import { Badge } from "../../ui/Badge.tsx";
import Button from "../../ui/Button.tsx";

import "./BlobViewer.css";

function DocumentIcon(props: JSX.IntrinsicElements["svg"] & { title: string }): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <title>{props.title}</title>
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    </svg>
  );
}

interface BlobViewerInnerProps {
  source: File | Blob;
}

function formatSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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

  const name = createMemo(() => {
    if (props.source instanceof File) {
      return props.source.name;
    }
    return props.source.type || "Blob";
  });

  return (
    <Button data-start-blob-viewer onClick={() => openFileInNewTab()}>
      <DocumentIcon title={name()} />
      <span data-start-blob-viewer-info>
        <span data-start-blob-viewer-name>{name()}</span>
        <span data-start-blob-viewer-meta>
          <Badge type="info">{props.source.type || "unknown"}</Badge>
          <span>{formatSize(props.source.size)}</span>
        </span>
      </span>
    </Button>
  );
}

export interface BlobViewerProps {
  source: Blob | File | Promise<Blob | File>;
}

export function BlobViewer(props: BlobViewerProps): JSX.Element {
  const [data] = createResource(() => props.source);

  return (
    <Suspense>
      <Show when={data()}>{current => <BlobViewerInner source={current()} />}</Show>
    </Suspense>
  );
}
