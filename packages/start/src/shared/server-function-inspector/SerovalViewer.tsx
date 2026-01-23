import type { SerovalNode } from "seroval";
import {
  createEffect,
  createSignal,
  For,
  type JSX,
  Show,
  splitProps,
} from "solid-js";

import { SerovalChunkReader } from "../../server/serialization.ts";
import { Badge } from "../ui/Badge.tsx";
import { Cascade, CascadeOption } from "../ui/Cascade.tsx";
import { PropertySeparator } from "../ui/Properties.tsx";
import { Section } from "../ui/Section.tsx";
import { HexViewer } from "./HexViewer.tsx";
import { SerovalValue } from "./SerovalValue.tsx";

import "./SerovalViewer.css";

function LinkIcon(
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
  throw new Error("unsupported node type");
}

function traverse(
  node: SerovalNode,
  handler: (node: SerovalNode) => void,
): void {
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

function zip<Key, Value>(
  keys: Key[],
  values: Value[],
): [key: Key, value: Value][] {
  const zipped: [key: Key, value: Value][] = [];

  for (let i = 0, len = keys.length; i < len; i++) {
    zipped[i] = [keys[i]!, values[i]!];
  }

  return zipped;
}

interface RenderContext {
  getNode: (index: number) => SerovalNode | undefined;
  getPromise: (
    index: number,
  ) => Extract<SerovalNode, { t: 23 | 24 }> | undefined;
  getStream: (
    index: number,
  ) => Extract<SerovalNode, { t: 32 | 33 | 34 }>[] | undefined;
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

function renderSerovalNode(
  ctx: RenderContext,
  node: SerovalNode,
  onSelect: (index: number | undefined) => void,
  inner?: boolean,
): JSX.Element {
  if (
    node.t >= 4 &&
    (inner || node.t === 4) &&
    node.i != null &&
    !(node.t === 5 || node.t === 6 || node.t === 17)
  ) {
    const index = node.i;
    const description = `id: ${index}`;
    const lookup = ctx.getNode(index)!;
    return (
      <CascadeOption data-start-seroval-link value={index}>
        <LinkIcon title={description} />
        <Badge type="info">{getNodeType(lookup)}</Badge>
        <Badge type="info">{description}</Badge>
      </CascadeOption>
    );
  }
  switch (node.t) {
    // Number = 0,
    case 0:
      return <SerovalValue value={node.s} />;
    // String = 1,
    case 1:
      return <SerovalValue value={`"${node.s}"`} />;
    // Constant = 2,
    case 2:
      return <SerovalValue value={getConstantValue(node.s)} />;
    // BigInt = 3,
    case 3:
      return (
        <div data-start-seroval-link>
          <Badge type="info">bigint</Badge>
          <SerovalValue value={node.s} />
        </div>
      );
    // Date = 5,
    case 5:
      return (
        <div data-start-seroval-link>
          <Badge type="info">Date</Badge>
          <SerovalValue value={node.s} />
        </div>
      );
    // RegExp = 6,
    case 6:
      return (
        <div data-start-seroval-link>
          <Badge type="info">RegExp</Badge>
          <SerovalValue value={`/${node.c}/${node.m}`} />
        </div>
      );
    // Set = 7,
    case 7:
      return (
        <>
          <Section title="Information" options={{ size: "xs" }}>
            <div data-start-seroval-property>
              <SerovalValue value="size" />
              <PropertySeparator />
              <SerovalValue value={`${node.a.length}`} />
            </div>
          </Section>
          <Section title="Items" options={{ size: "xs" }}>
            <Cascade<number | undefined>
              data-start-seroval-properties
              defaultValue={undefined}
              onChange={onSelect}
            >
              <For each={node.a.map((node, index) => [index, node] as const)}>
                {([key, value]) => (
                  <div data-start-seroval-property>
                    <SerovalValue value={key} />
                    <PropertySeparator />
                    {renderSerovalNode(ctx, value, onSelect, true)}
                  </div>
                )}
              </For>
            </Cascade>
          </Section>
        </>
      );
    // Map = 8,
    case 8:
      return (
        <>
          <Section title="Information" options={{ size: "xs" }}>
            <div data-start-seroval-property>
              <SerovalValue value="size" />
              <PropertySeparator />
              <SerovalValue value={`${node.e.k.length}`} />
            </div>
          </Section>
          <Section title="Items" options={{ size: "xs" }}>
            <Cascade<number | undefined>
              data-start-seroval-properties
              defaultValue={undefined}
              onChange={onSelect}
            >
              <For each={zip(node.e.k, node.e.v)}>
                {([key, value]) => (
                  <div data-start-seroval-property>
                    {renderSerovalNode(ctx, key, onSelect, true)}
                    <PropertySeparator />
                    {renderSerovalNode(ctx, value, onSelect, true)}
                  </div>
                )}
              </For>
            </Cascade>
          </Section>
        </>
      );
    // Array = 9,
    case 9:
      return (
        <>
          <Section title="Information" options={{ size: "xs" }}>
            <div data-start-seroval-property>
              <SerovalValue value="length" />
              <PropertySeparator />
              <SerovalValue value={`${node.a.length}`} />
            </div>
            <div data-start-seroval-property>
              <SerovalValue value="state" />
              <PropertySeparator />
              <Badge type="info">{getObjectFlag(node.o)}</Badge>
            </div>
          </Section>
          <Section title="Items" options={{ size: "xs" }}>
            <Cascade<number | undefined>
              data-start-seroval-properties
              defaultValue={undefined}
              onChange={onSelect}
            >
              <For each={node.a.map((node, index) => [index, node] as const)}>
                {([key, value]) => (
                  <div data-start-seroval-property>
                    <SerovalValue value={key} />
                    <PropertySeparator />
                    {value === 0 ? (
                      <SerovalValue value="empty" />
                    ) : (
                      renderSerovalNode(ctx, value, onSelect, true)
                    )}
                  </div>
                )}
              </For>
            </Cascade>
          </Section>
        </>
      );
    // Object = 10,
    case 10:
    // NullConstructor = 11,
    case 11:
      return (
        <>
          <Section title="Information" options={{ size: "xs" }}>
            <div data-start-seroval-property>
              <SerovalValue value="size" />
              <PropertySeparator />
              <SerovalValue value={`${node.p.k.length}`} />
            </div>
            <div data-start-seroval-property>
              <SerovalValue value="state" />
              <PropertySeparator />
              <Badge type="info">{getObjectFlag(node.o)}</Badge>
            </div>
          </Section>
          <Section title="Properties" options={{ size: "xs" }}>
            <Cascade<number | undefined>
              data-start-seroval-properties
              defaultValue={undefined}
              onChange={onSelect}
            >
              <For each={zip(node.p.k, node.p.v)}>
                {([key, value]) => (
                  <div data-start-seroval-property>
                    {typeof key === "string" ? (
                      <SerovalValue value={`"${key}"`} />
                    ) : (
                      renderSerovalNode(ctx, key, onSelect, true)
                    )}
                    <PropertySeparator />
                    {renderSerovalNode(ctx, value, onSelect, true)}
                  </div>
                )}
              </For>
            </Cascade>
          </Section>
        </>
      );
    // Promise = 12,
    case 12:
      return (
        <Cascade<number | undefined>
          data-start-seroval-properties
          defaultValue={undefined}
          onChange={onSelect}
        >
          {renderSerovalNode(ctx, node.f, onSelect, true)}
        </Cascade>
      );
    // Error = 13,
    case 13:
    // AggregateError = 14,
    case 14:
      return (
        <>
          <Section title="Information" options={{ size: "xs" }}>
            <div data-start-seroval-property>
              <SerovalValue value="message" />
              <PropertySeparator />
              <SerovalValue value={`"${node.m}"`} />
            </div>
          </Section>
          <Show when={node.p}>
            {(current) => (
              <Section title="Properties" options={{ size: "xs" }}>
                <Cascade<number | undefined>
                  data-start-seroval-properties
                  defaultValue={undefined}
                  onChange={onSelect}
                >
                  <For each={zip(current().k, current().v)}>
                    {([key, value]) => (
                      <div data-start-seroval-property>
                        {typeof key === "string" ? (
                          <SerovalValue value={`"${key}"`} />
                        ) : (
                          renderSerovalNode(ctx, key, onSelect, true)
                        )}
                        <PropertySeparator />
                        {renderSerovalNode(ctx, value, onSelect, true)}
                      </div>
                    )}
                  </For>
                </Cascade>
              </Section>
            )}
          </Show>
        </>
      );
    // WKSymbol = 17,
    case 17:
      return <SerovalValue value={getSymbolValue(node.s)} />;
    // Reference = 18,
    case 18:
      break;
    // ArrayBuffer = 19,
    case 19: {
      const data = atob(node.s);
      const result = new TextEncoder().encode(data);
      return <HexViewer bytes={result} />;
    }
    // TypedArray = 15,
    case 15:
    // BigIntTypedArray = 16,
    case 16:
    // DataView = 20,
    case 20:
      return (
        <>
          <Section title="Information" options={{ size: "xs" }}>
            <div data-start-seroval-property>
              <SerovalValue value="byteLength" />
              <PropertySeparator />
              <SerovalValue value={node.l} />
            </div>
            <div data-start-seroval-property>
              <SerovalValue value="byteOffset" />
              <PropertySeparator />
              <SerovalValue value={node.b} />
            </div>
          </Section>
          <Section title="Buffer" options={{ size: "xs" }}>
            <Cascade<number | undefined>
              data-start-seroval-properties
              defaultValue={undefined}
              onChange={onSelect}
            >
              {renderSerovalNode(ctx, node.f, onSelect, true)}
            </Cascade>
          </Section>
        </>
      );
    // Boxed = 21,
    case 21:
      return (
        <Cascade<number | undefined>
          data-start-seroval-properties
          defaultValue={undefined}
          onChange={onSelect}
        >
          {renderSerovalNode(ctx, node.f, onSelect, true)}
        </Cascade>
      );
    case 22:
      return (
        <>
          {(() => {
            const result = ctx.getPromise(node.s);
            if (result) {
              const status = result.t === 23 ? "success" : ("failure" as const);
              return (
                <Cascade<number | undefined>
                  data-start-seroval-properties
                  defaultValue={undefined}
                  onChange={onSelect}
                >
                  <div data-start-seroval-property>
                    <SerovalValue value="status" />
                    <PropertySeparator />
                    <Badge type={status}>{status}</Badge>
                  </div>
                  <span data-start-seroval-property>
                    <SerovalValue value="value" />
                    <PropertySeparator />
                    {renderSerovalNode(ctx, result.a[1], onSelect, true)}
                  </span>
                </Cascade>
              );
            }
            return <Badge type="warning">pending</Badge>;
          })()}
        </>
      );
    // Plugin = 25
    case 25:
      return (
        <>
          <Section title="Information" options={{ size: "xs" }}>
            <div data-start-seroval-property>
              <SerovalValue value="plugin" />
              <PropertySeparator />
              <SerovalValue value={node.c} />
            </div>
          </Section>
          <Section title="Properties" options={{ size: "xs" }}>
            <Cascade<number | undefined>
              data-start-seroval-properties
              defaultValue={undefined}
              onChange={onSelect}
            >
              <For each={Object.entries(node.s)}>
                {([key, value]) => (
                  <div data-start-seroval-property>
                    <SerovalValue value={key} />
                    <PropertySeparator />
                    {renderSerovalNode(ctx, value, onSelect, true)}
                  </div>
                )}
              </For>
            </Cascade>
          </Section>
        </>
      );
    // IteratorFactory = 27,
    case 27:
      break;
    // IteratorFactoryInstance = 28,
    case 28:
      return renderSerovalNode(ctx, node.a[1], onSelect, true);
    // AsyncIteratorFactory = 29,
    case 29:
      break;
    // AsyncIteratorFactoryInstance = 30,
    case 30:
      return renderSerovalNode(ctx, node.a[1], onSelect, true);
    // StreamConstructor = 31,
    case 31:
      return (
        <>
          {(() => {
            const result = ctx.getStream(node.i) || [];
            return (
              <Cascade<number | undefined>
                data-start-seroval-properties
                defaultValue={undefined}
                onChange={onSelect}
              >
                <For each={result}>
                  {(current) => (
                    <div data-start-seroval-property>
                      <SerovalValue value={getStreamKeyword(current.t)} />
                      <PropertySeparator />
                      {renderSerovalNode(ctx, current.f, onSelect, true)}
                    </div>
                  )}
                </For>
              </Cascade>
            );
          })()}
        </>
      );
    case 35:
      return (
        <Cascade<number | undefined>
          data-start-seroval-properties
          defaultValue={undefined}
          onChange={onSelect}
        >
          <For each={node.a}>
            {(current, index) => (
              <div data-start-seroval-property>
                <SerovalValue value={index() === node.l ? 'return' : index() === node.s ? 'throw' : 'next'} />
                <PropertySeparator />
                {renderSerovalNode(ctx, current, onSelect, true)}
              </div>
            )}
          </For>
        </Cascade>
      );
  }
}

interface SerovalNodeRendererProps extends RenderContext {
  node: SerovalNode;
}

function SerovalNodeRenderer(props: SerovalNodeRendererProps): JSX.Element {
  const [, rest] = splitProps(props, ["node"]);
  const [next, setNext] = createSignal<SerovalNode>();

  function onSelect(index: number | undefined) {
    if (index == null) {
      setNext(undefined);
    } else {
      setNext(props.getNode(index));
    }
  }

  return (
    <>
      <div data-start-seroval-node>
        <div data-start-seroval-node-header>
          {props.node.i != null && (
            <Badge type="info">{`id: ${props.node.i}`}</Badge>
          )}
          <Badge type="info">{getNodeType(props.node)}</Badge>
        </div>
        <div data-start-seroval-node-content>
          {renderSerovalNode(props, props.node, onSelect)}
        </div>
      </div>
      <Show when={next()} keyed>
        {(current) => <SerovalNodeRenderer node={current} {...rest} />}
      </Show>
    </>
  );
}

interface SerovalRendererProps extends Omit<RenderContext, "onSelect"> {
  node?: SerovalNode;
}

function SerovalRenderer(props: SerovalRendererProps): JSX.Element {
  const [, rest] = splitProps(props, ["node"]);
  return (
    <div data-start-seroval-renderer>
      <Show when={props.node}>
        {(current) => <SerovalNodeRenderer node={current()} {...rest} />}
      </Show>
    </div>
  );
}

function createSimpleStore<T extends Record<string | number, unknown>>(
  initial: T,
) {
  const [state, setState] = createSignal<T>(initial);

  return {
    get(): T {
      return state();
    },
    read<K extends keyof T>(key: K): T[K] {
      return state()[key];
    },
    write<K extends keyof T>(key: K, value: T[K]): void {
      setState((current) => ({
        ...current,
        [key]: value,
      }));
    },
    update<K extends keyof T>(key: K, value: (current: T[K]) => T[K]): void {
      setState((current) => ({
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
            streams.update(node.i, (current) => {
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
      <SerovalRenderer
        node={selected()}
        getNode={(index) => references.read(index)}
        getPromise={(index) => promises.read(index)}
        getStream={(index) => streams.read(index)}
      />
    </div>
  );
}
