import { createMemo, createResource, For, type JSX, Show, Suspense } from "solid-js";
import { Text } from "../../ui/Text.tsx";

import "./HexViewer.css";

function toHex(num: number, digits = 2): string {
  return num.toString(16).padStart(digits, "0").toUpperCase();
}

function HexChunk(props: HexViewerInnerProps) {
  const content = createMemo(() => {
    const byte1 = props.bytes[0] || 0;
    const byte2 = props.bytes[1] || 0;
    const byte3 = props.bytes[2] || 0;
    const byte4 = props.bytes[3] || 0;

    return `${toHex(byte1)} ${toHex(byte2)} ${toHex(byte3)} ${toHex(byte4)}`;
  });
  return (
    <Text data-start-hex-chunk options={{ size: "xs", weight: "bold", wrap: "nowrap" }}>
      {content()}
    </Text>
  );
}

interface HexRowProps extends HexViewerInnerProps {
  offset: number;
}

function HexRow(props: HexRowProps) {
  const chunk1 = createMemo(() => props.bytes.subarray(0, 4));
  const chunk2 = createMemo(() => props.bytes.subarray(4, 8));
  const chunk3 = createMemo(() => props.bytes.subarray(8, 12));
  const chunk4 = createMemo(() => props.bytes.subarray(12, 16));

  return (
    <div data-start-hex-row>
      <Text data-start-hex-offset options={{ size: "xs", weight: "semibold", wrap: "nowrap" }}>
        {toHex(props.offset, 8)}
      </Text>
      <HexChunk bytes={chunk1()} />
      <HexChunk bytes={chunk2()} />
      <HexChunk bytes={chunk3()} />
      <HexChunk bytes={chunk4()} />
      <HexText bytes={props.bytes} />
    </div>
  );
}

function replaceString(string: string): string {
  const result = string.codePointAt(0);
  if (result == null) {
    return string;
  }
  return String.fromCodePoint(result + 0x2400);
}

function HexText(props: HexViewerInnerProps) {
  const text = createMemo(() => {
    const decoder = new TextDecoder();
    const result = decoder.decode(props.bytes).replaceAll(/[\x00-\x1F]/g, replaceString);
    return result;
  });

  return (
    <div data-start-hex-text>
      <Text options={{ size: "xs", weight: "bold", wrap: "nowrap" }}>{text()}</Text>
    </div>
  );
}

interface HexViewerInnerProps {
  bytes: Uint8Array;
}

export function HexViewerInner(props: HexViewerInnerProps): JSX.Element {
  const rows = createMemo(() => {
    const arrays: Uint8Array[] = [];
    for (let i = 0, len = props.bytes.length; i < len; i += 16) {
      arrays.push(props.bytes.subarray(i, i + 16));
    }
    return arrays;
  });

  return (
    <div data-start-hex-viewer>
      <For each={rows()}>
        {(current, index) => <HexRow bytes={current} offset={index() * 16} />}
      </For>
    </div>
  );
}

export interface HexViewerProps {
  bytes: Uint8Array | Promise<Uint8Array>;
}

export function HexViewer(props: HexViewerProps): JSX.Element {
  const [data] = createResource(() => props.bytes);

  return (
    <Suspense>
      <Show when={data()}>{current => <HexViewerInner bytes={current()} />}</Show>
    </Suspense>
  );
}
