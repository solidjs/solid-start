import type { SerovalNode } from "seroval";
import { createEffect, createSignal, For, type JSX, Show } from "solid-js";

import { Badge } from "../../ui/Badge.tsx";
import { HexViewer } from "./HexViewer.tsx";
import { PropertySeparator, SerovalValue } from "./SerovalValue.tsx";

import { SerovalChunkReader } from "../../../fns/serialization.ts";
import "./SerovalViewer.css";

function LinkIcon(props: JSX.IntrinsicElements["svg"] & { title: string }): JSX.Element {
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
        d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
      />
    </svg>
  );
}

export interface SerovalViewerProps {
  stream: Request | Response;
}

function getNodeType(node: SerovalNode) {
  switch (node.t) {
    // Number = 0,
    case 0:
      return "number";
    // String = 1,
    case 1:
      return "string";
    // Constant = 2,
    case 2:
      switch (node.s) {
        case 0:
          return "null";
        case 1:
          return "undefined";
        case 2:
          return "true";
        case 3:
          return "false";
        case 4:
          return "-0";
        case 5:
          return "Infinity";
        case 6:
          return "-Infinity";
        case 7:
          return "NaN";
      }
      break;
    // BigInt = 3,
    case 3:
      return "bigint";
    // Date = 5,
    case 5:
      return "Date";
    // RegExp = 6,
    case 6:
      return "RegExp";
    // Set = 7,
    case 7:
      return "Set";
    // Map = 8,
    case 8:
      return "Map";
    // Array = 9,
    case 9:
      return "Array";
    // Object = 10,
    case 10:
    // NullConstructor = 11,
    case 11:
      return "Object";
    // Promise = 12,
    case 12:
      return "Promise";
    // Error = 13,
    case 13:
      switch (node.s) {
        case 0:
          return "Error";
        case 1:
          return "EvalError";
        case 2:
          return "RangeError";
        case 3:
          return "ReferenceError";
        case 4:
          return "SyntaxError";
        case 5:
          return "TypeError";
        case 6:
          return "URIError";
      }
      return "Error";
    // AggregateError = 14,
    case 14:
      return "AggregateError";
    // TypedArray = 15,
    case 15:
    // BigIntTypedArray = 16,
    case 16:
      return node.c;
    // WKSymbol = 17,
    case 17:
      return "symbol";
    // ArrayBuffer = 19,
    case 19:
      return "ArrayBuffer";
    // DataView = 20,
    case 20:
      return "DataView";
    // Boxed = 21,
    case 21:
      return "Boxed";
    // PromiseConstructor = 22,
    case 22:
      return "Promise";
    // Plugin = 25,
    case 25:
      // due to the nature of this node, we have to traverse it ourselves
      return "Plugin";
    // IteratorFactoryInstance = 28,
    case 28:
      return "Iterator";
    // AsyncIteratorFactoryInstance = 30,
    case 30:
      return "AsyncIterator";
    // StreamConstructor = 31,
    case 31:
      return "Stream";
    case 35:
      return "Sequence";
  }
  return "unknown";
}

function traverse(node: SerovalNode, handler: (node: SerovalNode) => void): void {
  handler(node);
  switch (node.t) {
    // Number = 0,
    case 0:
    // String = 1,
    case 1:
    // Constant = 2,
    case 2:
    // BigInt = 3,
    case 3:
    // IndexedValue = 4,
    case 4:
    // Date = 5,
    case 5:
    // RegExp = 6,
    case 6:
      break;
    // Set = 7,
    case 7:
      // Traverse items
      for (const child of node.a) {
        traverse(child, handler);
      }
      break;
    // Map = 8,
    case 8:
      // Traverse keys
      for (const key of node.e.k) {
        traverse(key, handler);
      }
      for (const value of node.e.v) {
        traverse(value, handler);
      }
      break;
    // Array = 9,
    case 9:
      // Traverse items
      for (const child of node.a) {
        if (child) {
          traverse(child, handler);
        }
      }
      break;
    // Object = 10,
    case 10:
    // NullConstructor = 11,
    case 11:
      for (const child of node.p.k) {
        if (typeof child !== "string") {
          traverse(child, handler);
        }
      }
      for (const child of node.p.v) {
        traverse(child, handler);
      }
      break;
    // Promise = 12,
    case 12:
      traverse(node.f, handler);
      break;
    // Error = 13,
    case 13:
    // AggregateError = 14,
    case 14:
      if (node.p) {
        for (const child of node.p.k) {
          if (typeof child !== "string") {
            traverse(child, handler);
          }
        }
        for (const child of node.p.v) {
          traverse(child, handler);
        }
      }
      break;
    // TypedArray = 15,
    case 15:
    // BigIntTypedArray = 16,
    case 16:
      traverse(node.f, handler);
      break;
    // WKSymbol = 17,
    case 17:
    // Reference = 18,
    case 18:
      break;
    // ArrayBuffer = 19,
    case 19:
    // DataView = 20,
    case 20:
    // Boxed = 21,
    case 21:
      traverse(node.f, handler);
      break;
    // PromiseConstructor = 22,
    case 22:
      break;
    // PromiseSuccess = 23,
    case 23:
    // PromiseFailure = 24,
    case 24:
      traverse(node.a[1], handler);
      break;
    // Plugin = 25,
    case 25:
      for (const key in node.s) {
        const current = node.s[key];
        if (current) {
          traverse(current, handler);
        }
      }
      break;
    // SpecialReference = 26,
    case 26:
      break;
    // IteratorFactory = 27,
    case 27:
      traverse(node.f, handler);
      break;
    // IteratorFactoryInstance = 28,
    case 28:
      traverse(node.a[0], handler);
      traverse(node.a[1], handler);
      break;
    // AsyncIteratorFactory = 29,
    case 29:
      traverse(node.a[1], handler);
      break;
    // AsyncIteratorFactoryInstance = 30,
    case 30:
      traverse(node.a[0], handler);
      traverse(node.a[1], handler);
      break;
    // StreamConstructor = 31,
    case 31:
      // Traverse items
      for (const child of node.a) {
        traverse(child, handler);
      }
      break;
    // StreamNext = 32,
    case 32:
    // StreamThrow = 33,
    case 33:
    // StreamReturn = 34
    case 34:
      traverse(node.f, handler);
      break;
    case 35:
      // Traverse items
      for (const child of node.a) {
        if (child) {
          traverse(child, handler);
        }
      }
      break;
  }
}

function getConstantValue(value: number) {
  switch (value) {
    case 0:
      return "null";
    case 1:
      return "undefined";
    case 2:
      return "true";
    case 3:
      return "false";
    case 4:
      return "-0";
    case 5:
      return "Infinity";
    case 6:
      return "-Infinity";
    case 7:
      return "NaN";
  }
  return "";
}

function getSymbolValue(value: number) {
  switch (value) {
    case 0:
      return "Symbol.asyncIterator";
    case 1:
      return "Symbol.hasInstance";
    case 2:
      return "Symbol.isConcatSpreadable";
    case 3:
      return "Symbol.iterator";
    case 4:
      return "Symbol.match";
    case 5:
      return "Symbol.matchAll";
    case 6:
      return "Symbol.replace";
    case 7:
      return "Symbol.search";
    case 8:
      return "Symbol.species";
    case 9:
      return "Symbol.toPrimitive";
    case 10:
      return "Symbol.toStringTag";
    case 11:
      return "Symbol.unscopables";
  }
  return "";
}

function getObjectFlag(value: number) {
  switch (value) {
    case 1:
      return "non-extensible";
    case 2:
      return "sealed";
    case 3:
      return "frozen";
    default:
      return "none";
  }
}

function zip<Key, Value>(keys: Key[], values: Value[]): [key: Key, value: Value][] {
  const zipped: [key: Key, value: Value][] = [];

  for (let i = 0, len = keys.length; i < len; i++) {
    zipped[i] = [keys[i]!, values[i]!];
  }

  return zipped;
}

interface RenderContext {
  getNode: (index: number) => SerovalNode | undefined;
  getPromise: (index: number) => Extract<SerovalNode, { t: 23 | 24 }> | undefined;
  getStream: (index: number) => Extract<SerovalNode, { t: 32 | 33 | 34 }>[] | undefined;
}

function getStreamKeyword(t: 32 | 33 | 34): string {
  switch (t) {
    case 32:
      return "next";
    case 33:
      return "throw";
    case 34:
      return "return";
  }
}

const PREVIEW_LENGTH = 32;
const PREVIEW_KEYS = 3;

function truncate(value: string): string {
  if (value.length > PREVIEW_LENGTH) {
    return `${value.slice(0, PREVIEW_LENGTH)}…`;
  }
  return value;
}

function previewNode(ctx: RenderContext, node: SerovalNode, depth: number): string {
  switch (node.t) {
    case 0:
      return `${node.s}`;
    case 1:
      return truncate(`"${node.s}"`);
    case 2:
      return getConstantValue(node.s);
    case 3:
      return `${node.s}n`;
    case 4: {
      if (depth >= 1) {
        return `#${node.i}`;
      }
      const target = ctx.getNode(node.i);
      return target ? previewNode(ctx, target, depth + 1) : `#${node.i}`;
    }
    case 5:
      return truncate(`${node.s}`);
    case 6:
      return truncate(`/${node.c}/${node.m}`);
    case 7:
      return `Set(${node.a.length})`;
    case 8:
      return `Map(${node.e.k.length})`;
    case 9:
      return `Array(${node.a.length})`;
    case 10:
    case 11: {
      if (depth >= 1) {
        return "{…}";
      }
      const keys = node.p.k.filter(key => typeof key === "string").slice(0, PREVIEW_KEYS);
      const rest = node.p.k.length > keys.length ? ", …" : "";
      return keys.length ? `{${keys.join(", ")}${rest}}` : "{}";
    }
    case 12:
      return "Promise";
    case 13:
    case 14:
      return truncate(`${getNodeType(node)}: ${node.m}`);
    case 15:
    case 16:
      return `${node.c}(${node.l})`;
    case 17:
      return getSymbolValue(node.s);
    case 19:
      return "ArrayBuffer";
    case 20:
      return `DataView(${node.l})`;
    case 21:
      return previewNode(ctx, node.f, depth);
    case 22: {
      const result = ctx.getPromise(node.s);
      if (result) {
        return `Promise<${result.t === 23 ? "success" : "failure"}>`;
      }
      return "Promise<pending>";
    }
    case 25:
      return `Plugin(${node.c})`;
    case 28:
      return "Iterator";
    case 30:
      return "AsyncIterator";
    case 31:
      return `Stream(${(ctx.getStream(node.i) || []).length})`;
    case 35:
      return `Sequence(${node.a.length})`;
    default:
      return getNodeType(node);
  }
}

interface EntryKeyProps {
  value: string | number;
  kind?: "key" | "number" | "keyword";
}

function EntryKey(props: EntryKeyProps): JSX.Element {
  return (
    <span data-start-seroval-tree-key>
      <SerovalValue kind={props.kind ?? "key"} value={props.value} />
      <PropertySeparator />
    </span>
  );
}

interface LeafRowProps {
  label?: JSX.Element;
  children: JSX.Element;
}

function LeafRow(props: LeafRowProps): JSX.Element {
  return (
    <div data-start-seroval-tree-node>
      <div data-start-seroval-tree-row>
        <span data-start-seroval-tree-chevron data-leaf="true" />
        {props.label}
        {props.children}
      </div>
    </div>
  );
}

interface ExpandableRowProps {
  label?: JSX.Element;
  badges?: JSX.Element;
  preview: JSX.Element;
  open?: boolean;
  children: JSX.Element;
}

function ExpandableRow(props: ExpandableRowProps): JSX.Element {
  const [open, setOpen] = createSignal(props.open ?? false);
  return (
    <div data-start-seroval-tree-node>
      <button
        type="button"
        data-start-seroval-tree-row
        data-expanded={open() ? "true" : undefined}
        onClick={() => setOpen(current => !current)}
      >
        <span data-start-seroval-tree-chevron />
        {props.label}
        {props.badges}
        <Show when={!open()}>
          <span data-start-seroval-tree-preview>{props.preview}</span>
        </Show>
      </button>
      <Show when={open()}>
        <div data-start-seroval-tree-children>{props.children}</div>
      </Show>
    </div>
  );
}

interface TreeValueProps {
  ctx: RenderContext;
  node: SerovalNode;
  seen: number[];
  label?: JSX.Element;
  open?: boolean;
}

function TreeValue(props: TreeValueProps): JSX.Element {
  const ctx = props.ctx;
  const node = props.node;

  // Indexed reference: resolve reactively, guard cycles
  if (node.t === 4) {
    const index = node.i;
    if (props.seen.includes(index)) {
      return (
        <LeafRow label={props.label}>
          <span data-start-seroval-tree-circular>
            <LinkIcon title={`Circular reference to #${index}`} />
            <Badge type="info">{`circular #${index}`}</Badge>
          </span>
        </LeafRow>
      );
    }
    return (
      <Show
        when={ctx.getNode(index)}
        keyed
        fallback={
          <LeafRow label={props.label}>
            <Badge type="warning">{`#${index} pending`}</Badge>
          </LeafRow>
        }
      >
        {target => (
          <TreeValue
            ctx={ctx}
            node={target}
            seen={props.seen}
            label={props.label}
            open={props.open}
          />
        )}
      </Show>
    );
  }

  const seen = node.i != null ? [...props.seen, node.i] : props.seen;
  const flag = "o" in node ? getObjectFlag(node.o ?? 0) : "none";
  const badges = (
    <>
      {node.i != null && <Badge type="info">{`#${node.i}`}</Badge>}
      {flag !== "none" && <Badge type="warning">{flag}</Badge>}
    </>
  );

  switch (node.t) {
    // Number = 0,
    case 0:
      return (
        <LeafRow label={props.label}>
          <SerovalValue kind="number" value={node.s} />
        </LeafRow>
      );
    // String = 1,
    case 1:
      return (
        <LeafRow label={props.label}>
          <SerovalValue kind="string" value={`"${node.s}"`} />
        </LeafRow>
      );
    // Constant = 2,
    case 2:
      return (
        <LeafRow label={props.label}>
          <SerovalValue kind="keyword" value={getConstantValue(node.s)} />
        </LeafRow>
      );
    // BigInt = 3,
    case 3:
      return (
        <LeafRow label={props.label}>
          <SerovalValue kind="number" value={`${node.s}n`} />
        </LeafRow>
      );
    // Date = 5,
    case 5:
      return (
        <LeafRow label={props.label}>
          <Badge type="info">Date</Badge>
          <SerovalValue kind="string" value={node.s} />
        </LeafRow>
      );
    // RegExp = 6,
    case 6:
      return (
        <LeafRow label={props.label}>
          <Badge type="info">RegExp</Badge>
          <SerovalValue kind="string" value={`/${node.c}/${node.m}`} />
        </LeafRow>
      );
    // WKSymbol = 17,
    case 17:
      return (
        <LeafRow label={props.label}>
          <SerovalValue kind="keyword" value={getSymbolValue(node.s)} />
        </LeafRow>
      );
    // Set = 7,
    case 7:
      return (
        <ExpandableRow
          label={props.label}
          badges={badges}
          preview={previewNode(ctx, node, 0)}
          open={props.open}
        >
          <For each={node.a}>
            {(child, index) => (
              <TreeValue
                ctx={ctx}
                node={child}
                seen={seen}
                label={<EntryKey kind="number" value={index()} />}
              />
            )}
          </For>
        </ExpandableRow>
      );
    // Map = 8,
    case 8:
      return (
        <ExpandableRow
          label={props.label}
          badges={badges}
          preview={previewNode(ctx, node, 0)}
          open={props.open}
        >
          <For each={zip(node.e.k, node.e.v)}>
            {([key, value], index) => (
              <ExpandableRow
                label={<EntryKey kind="number" value={index()} />}
                preview={`{${previewNode(ctx, key, 1)} => ${previewNode(ctx, value, 1)}}`}
              >
                <TreeValue
                  ctx={ctx}
                  node={key}
                  seen={seen}
                  label={<EntryKey kind="keyword" value="key" />}
                />
                <TreeValue
                  ctx={ctx}
                  node={value}
                  seen={seen}
                  label={<EntryKey kind="keyword" value="value" />}
                />
              </ExpandableRow>
            )}
          </For>
        </ExpandableRow>
      );
    // Array = 9,
    case 9:
      return (
        <ExpandableRow
          label={props.label}
          badges={badges}
          preview={previewNode(ctx, node, 0)}
          open={props.open}
        >
          <For each={node.a}>
            {(child, index) =>
              child === 0 ? (
                <LeafRow label={<EntryKey kind="number" value={index()} />}>
                  <SerovalValue kind="keyword" value="empty" />
                </LeafRow>
              ) : (
                <TreeValue
                  ctx={ctx}
                  node={child}
                  seen={seen}
                  label={<EntryKey kind="number" value={index()} />}
                />
              )
            }
          </For>
        </ExpandableRow>
      );
    // Object = 10,
    case 10:
    // NullConstructor = 11,
    case 11:
      return (
        <ExpandableRow
          label={props.label}
          badges={badges}
          preview={previewNode(ctx, node, 0)}
          open={props.open}
        >
          <For each={zip(node.p.k, node.p.v)}>
            {([key, value]) => (
              <TreeValue
                ctx={ctx}
                node={value}
                seen={seen}
                label={
                  <EntryKey value={typeof key === "string" ? key : previewNode(ctx, key, 1)} />
                }
              />
            )}
          </For>
        </ExpandableRow>
      );
    // Promise = 12,
    case 12:
      return (
        <ExpandableRow
          label={props.label}
          badges={badges}
          preview={previewNode(ctx, node, 0)}
          open={props.open}
        >
          <TreeValue
            ctx={ctx}
            node={node.f}
            seen={seen}
            label={<EntryKey kind="keyword" value="value" />}
          />
        </ExpandableRow>
      );
    // Error = 13,
    case 13:
    // AggregateError = 14,
    case 14:
      return (
        <ExpandableRow
          label={props.label}
          badges={badges}
          preview={previewNode(ctx, node, 0)}
          open={props.open}
        >
          <LeafRow label={<EntryKey kind="keyword" value="message" />}>
            <SerovalValue kind="string" value={`"${node.m}"`} />
          </LeafRow>
          <Show when={node.p}>
            {properties => (
              <For each={zip(properties().k, properties().v)}>
                {([key, value]) => (
                  <TreeValue
                    ctx={ctx}
                    node={value}
                    seen={seen}
                    label={
                      <EntryKey value={typeof key === "string" ? key : previewNode(ctx, key, 1)} />
                    }
                  />
                )}
              </For>
            )}
          </Show>
        </ExpandableRow>
      );
    // TypedArray = 15,
    case 15:
    // BigIntTypedArray = 16,
    case 16:
    // DataView = 20,
    case 20:
      return (
        <ExpandableRow
          label={props.label}
          badges={badges}
          preview={previewNode(ctx, node, 0)}
          open={props.open}
        >
          <LeafRow label={<EntryKey kind="keyword" value="byteLength" />}>
            <SerovalValue kind="number" value={node.l} />
          </LeafRow>
          <LeafRow label={<EntryKey kind="keyword" value="byteOffset" />}>
            <SerovalValue kind="number" value={node.b} />
          </LeafRow>
          <TreeValue
            ctx={ctx}
            node={node.f}
            seen={seen}
            label={<EntryKey kind="keyword" value="buffer" />}
          />
        </ExpandableRow>
      );
    // ArrayBuffer = 19,
    case 19:
      return (
        <ExpandableRow
          label={props.label}
          badges={badges}
          preview={previewNode(ctx, node, 0)}
          open={props.open}
        >
          <div data-start-seroval-tree-raw>
            {(() => {
              const data = atob(node.s);
              const result = new TextEncoder().encode(data);
              return <HexViewer bytes={result} />;
            })()}
          </div>
        </ExpandableRow>
      );
    // Boxed = 21,
    case 21:
      return (
        <ExpandableRow
          label={props.label}
          badges={badges}
          preview={previewNode(ctx, node, 0)}
          open={props.open}
        >
          <TreeValue
            ctx={ctx}
            node={node.f}
            seen={seen}
            label={<EntryKey kind="keyword" value="value" />}
          />
        </ExpandableRow>
      );
    // PromiseConstructor = 22,
    case 22:
      return (
        <ExpandableRow
          label={props.label}
          badges={badges}
          preview={<>{previewNode(ctx, node, 0)}</>}
          open={props.open}
        >
          <Show
            when={ctx.getPromise(node.s)}
            keyed
            fallback={
              <LeafRow label={<EntryKey kind="keyword" value="status" />}>
                <Badge type="warning">pending</Badge>
              </LeafRow>
            }
          >
            {result => (
              <>
                <LeafRow label={<EntryKey kind="keyword" value="status" />}>
                  <Badge type={result.t === 23 ? "success" : "failure"}>
                    {result.t === 23 ? "success" : "failure"}
                  </Badge>
                </LeafRow>
                <TreeValue
                  ctx={ctx}
                  node={result.a[1]}
                  seen={seen}
                  label={<EntryKey kind="keyword" value="value" />}
                />
              </>
            )}
          </Show>
        </ExpandableRow>
      );
    // Plugin = 25,
    case 25:
      return (
        <ExpandableRow
          label={props.label}
          badges={badges}
          preview={previewNode(ctx, node, 0)}
          open={props.open}
        >
          <For each={Object.entries(node.s)}>
            {([key, value]) => (
              <TreeValue ctx={ctx} node={value} seen={seen} label={<EntryKey value={key} />} />
            )}
          </For>
        </ExpandableRow>
      );
    // IteratorFactoryInstance = 28,
    case 28:
    // AsyncIteratorFactoryInstance = 30,
    case 30:
      return (
        <ExpandableRow
          label={props.label}
          badges={badges}
          preview={previewNode(ctx, node, 0)}
          open={props.open}
        >
          <TreeValue
            ctx={ctx}
            node={node.a[1]}
            seen={seen}
            label={<EntryKey kind="keyword" value="values" />}
          />
        </ExpandableRow>
      );
    // StreamConstructor = 31,
    case 31:
      return (
        <ExpandableRow
          label={props.label}
          badges={badges}
          preview={<>{previewNode(ctx, node, 0)}</>}
          open={props.open}
        >
          <For
            each={ctx.getStream(node.i) || []}
            fallback={
              <LeafRow label={<EntryKey kind="keyword" value="status" />}>
                <Badge type="warning">waiting</Badge>
              </LeafRow>
            }
          >
            {chunk => (
              <TreeValue
                ctx={ctx}
                node={chunk.f}
                seen={seen}
                label={<EntryKey kind="keyword" value={getStreamKeyword(chunk.t)} />}
              />
            )}
          </For>
        </ExpandableRow>
      );
    case 35:
      return (
        <ExpandableRow
          label={props.label}
          badges={badges}
          preview={previewNode(ctx, node, 0)}
          open={props.open}
        >
          <For each={node.a}>
            {(child, index) => (
              <Show when={child}>
                {current => (
                  <TreeValue
                    ctx={ctx}
                    node={current()}
                    seen={seen}
                    label={
                      <EntryKey
                        kind="keyword"
                        value={
                          index() === node.l ? "return" : index() === node.s ? "throw" : "next"
                        }
                      />
                    }
                  />
                )}
              </Show>
            )}
          </For>
        </ExpandableRow>
      );
    default:
      return (
        <LeafRow label={props.label}>
          <Badge type="warning">{getNodeType(node)}</Badge>
        </LeafRow>
      );
  }
}

function createSimpleStore<T extends Record<string | number, unknown>>(initial: T) {
  const [state, setState] = createSignal<T>(initial);

  return {
    get(): T {
      return state();
    },
    read<K extends keyof T>(key: K): T[K] {
      return state()[key];
    },
    write<K extends keyof T>(key: K, value: T[K]): void {
      setState(current => ({
        ...current,
        [key]: value,
      }));
    },
    update<K extends keyof T>(key: K, value: (current: T[K]) => T[K]): void {
      setState(current => ({
        ...current,
        [key]: value(current[key]),
      }));
    },
  };
}

export function SerovalViewer(props: SerovalViewerProps): JSX.Element {
  const [selected, setSelected] = createSignal<SerovalNode>();

  const references = createSimpleStore<
    Record<number, Extract<SerovalNode, { i: number }> | undefined>
  >({});
  const streams = createSimpleStore<
    Record<number, Extract<SerovalNode, { t: 32 | 33 | 34 }>[] | undefined>
  >({});
  const promises = createSimpleStore<
    Record<number, Extract<SerovalNode, { t: 23 | 24 }> | undefined>
  >({});

  createEffect(async () => {
    setSelected(undefined);
    if (!props.stream.body) {
      throw new Error("missing body");
    }
    const reader = new SerovalChunkReader(props.stream.body);
    const result = await reader.next();
    if (!result.done) {
      function traverseNode(node: SerovalNode): void {
        // Check for promises
        switch (node.t) {
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
            break;
          case 23:
          case 24:
            promises.write(node.i, node);
            break;
          case 32:
          case 33:
          case 34:
            streams.update(node.i, current => {
              if (current) {
                return [...current, node];
              }
              return [node];
            });
            break;
          case 5:
          case 6:
          case 7:
          case 8:
          case 9:
          case 10:
          case 11:
          case 12:
          case 13:
          case 14:
          case 15:
          case 16:
          case 17:
          case 18:
          case 19:
          case 20:
          case 21:
          case 25:
          case 26:
          case 27:
          case 29:
          case 31:
          case 35:
            references.write(node.i, node);
            break;
        }
      }

      function interpretChunk(chunk: string): SerovalNode {
        const result = JSON.parse(chunk) as SerovalNode;
        traverse(result, traverseNode);
        return result;
      }

      void reader.drain(interpretChunk);
      const root = interpretChunk(result.value);
      setSelected(root);
    }
  });

  return (
    <div data-start-seroval-viewer>
      <Show when={selected()} keyed>
        {root => (
          <TreeValue
            ctx={{
              getNode: index => references.read(index),
              getPromise: index => promises.read(index),
              getStream: index => streams.read(index),
            }}
            node={root}
            seen={[]}
            open
          />
        )}
      </Show>
    </div>
  );
}
