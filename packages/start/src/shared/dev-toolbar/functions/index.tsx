import { createMemo, createSignal, For, type JSX, Show } from "solid-js";
import { BODY_FORMAL_FILE, BODY_FORMAT_KEY, BodyFormat } from "../../../fns/shared.ts";
import { Badge } from "../../ui/Badge.tsx";
import IconButton from "../../ui/IconButton.tsx";
import Placeholder from "../../ui/Placeholder.tsx";
import { Section } from "../../ui/Section.tsx";
import { Select, SelectOption } from "../../ui/Select.tsx";
import { Tab, TabGroup, TabList, TabPanel } from "../../ui/Tabs.tsx";
import { Text } from "../../ui/Text.tsx";
import { ArrowLeftIcon, TrashIcon } from "../icons.tsx";
import { BlobViewer } from "./BlobViewer.tsx";
import { FormDataViewer } from "./FormDataViewer.tsx";
import { HeadersViewer } from "./HeadersViewer.tsx";
import { HexViewer } from "./HexViewer.tsx";
import { PropertySeparator, SerovalValue } from "./SerovalValue.tsx";
import { SerovalViewer } from "./SerovalViewer.tsx";
import "./styles.css";
import { type ServerFunctionRequest, type ServerFunctionResponse } from "./tracker.ts";
import { URLSearchParamsViewer } from "./URLSearchParamsViewer.tsx";

async function getFile(source: Response | Request): Promise<File> {
  const formData = await source.formData();
  const file = formData.get(BODY_FORMAL_FILE);
  if (!(file && file instanceof File)) {
    throw new Error("invalid file input");
  }
  return file;
}

async function getURLSearchParams(source: Response | Request): Promise<URLSearchParams> {
  const text = await source.text();
  return new URLSearchParams(text);
}

interface ContentViewerProps {
  source: ServerFunctionRequest | ServerFunctionResponse;
}

function ContentViewer(props: ContentViewerProps): JSX.Element {
  return (
    <>
      <Section title="Headers">
        <HeadersViewer headers={props.source.source.headers} />
      </Section>
      <Section title="Body">
        {(() => {
          const source = props.source.source.clone();
          const startType = source.headers.get(BODY_FORMAT_KEY);
          const contentType = source.headers.get("Content-Type");
          switch (true) {
            case startType === "true":
            case startType === BodyFormat.Seroval:
              return <SerovalViewer stream={source} />;
            case startType === BodyFormat.String:
              return <HexViewer bytes={source.bytes()} />;
            case startType === BodyFormat.File:
              return <BlobViewer source={getFile(source)} />;
            case startType === BodyFormat.FormData:
            case contentType?.startsWith("multipart/form-data"):
              return <FormDataViewer source={source.formData()} />;
            case startType === BodyFormat.URLSearchParams:
            case contentType?.startsWith("application/x-www-form-urlencoded"):
              return <URLSearchParamsViewer source={getURLSearchParams(source)} />;
            case startType === BodyFormat.Blob:
              return <BlobViewer source={source.blob()} />;
            case startType === BodyFormat.ArrayBuffer:
            case startType === BodyFormat.Uint8Array:
              return <HexViewer bytes={source.bytes()} />;
          }
        })()}
      </Section>
    </>
  );
}

interface RequestViewerProps {
  request: ServerFunctionRequest;
}

function convertRequestToEntries(request: Request) {
  return [
    ["Cache", request.cache],
    ["Credentials", request.credentials],
    ["Destination", request.destination],
    ["Integrity", request.integrity],
    ["Keep Alive", request.keepalive],
    ["Mode", request.mode],
    ["Redirect", request.redirect],
    ["Referrer", request.referrer],
    ["Referrer Policy", request.referrerPolicy],
    ["URL", request.url],
  ];
}

function RequestViewer(props: RequestViewerProps): JSX.Element {
  return (
    <TabPanel value="request">
      <Section title="Information">
        <For each={convertRequestToEntries(props.request.source)}>
          {([key, value]) => (
            <div data-start-property>
              <Text options={{ size: "xs", weight: "semibold", wrap: "nowrap" }}>{key}</Text>
              <PropertySeparator />
              <SerovalValue value={value} />
            </div>
          )}
        </For>
      </Section>
      <ContentViewer source={props.request} />
    </TabPanel>
  );
}

interface ResponseViewerProps {
  request: ServerFunctionRequest;
  response?: ServerFunctionResponse;
}

function convertResponseToEntries(response: Response) {
  return [
    ["OK", response.ok],
    ["Redirected", response.redirected],
    ["Status", response.status],
    ["Status Text", response.statusText],
    ["Type", response.type],
    ["URL", response.url],
  ];
}

function ResponseViewer(props: ResponseViewerProps): JSX.Element {
  return (
    <TabPanel value="response">
      <Show when={props.response}>
        {instance => (
          <>
            <Section title="Information">
              <For each={convertResponseToEntries(instance().source)}>
                {([key, value]) => (
                  <div data-start-property>
                    <Text options={{ size: "xs", weight: "semibold", wrap: "nowrap" }}>{key}</Text>
                    <PropertySeparator />
                    <SerovalValue value={value} />
                  </div>
                )}
              </For>
              <div data-start-property>
                <Text options={{ size: "xs", weight: "semibold", wrap: "nowrap" }}>Timing</Text>
                <PropertySeparator />
                <SerovalValue
                  value={`${((instance().time - props.request.time) / 1000).toFixed(2)}s`}
                />
              </div>
            </Section>
            <ContentViewer source={instance()} />
          </>
        )}
      </Show>
    </TabPanel>
  );
}

export interface ServerFunctionInstance {
  request: ServerFunctionRequest;
  response?: ServerFunctionResponse;
}

interface ServerFunctionInstanceDetailProps {
  id: string;
  value: ServerFunctionInstance;
}

function ServerFunctionInstanceDetail(props: ServerFunctionInstanceDetailProps) {
  return (
    <>
      <span data-start-functions-instance-detail>
        <Badge type="info">{props.value.request.source.method}</Badge>
        <Text options={{ size: "xs" }}>{props.id}</Text>
      </span>
      <Show when={props.value.response}>
        {response => {
          if (response().source.ok) {
            return <Badge type="success">{response().source.status}</Badge>;
          }
          return <Badge type="failure">{response().source.status}</Badge>;
        }}
      </Show>
    </>
  );
}

interface ServerFunctionInstanceViewerProps {
  id: string;
  instance: ServerFunctionInstance;
  onDelete: () => void;
  onReturn: () => void;
}

function ServerFunctionInstanceViewer(props: ServerFunctionInstanceViewerProps): JSX.Element {
  const [tab, setTab] = createSignal<"request" | "response">("request");
  return (
    <div data-start-function-instance-viewer>
      <div data-start-function-instance-viewer-nav>
        <div data-start-function-instance-viewer-nav-left>
          <IconButton onClick={props.onReturn}>
            <ArrowLeftIcon title="Go Back" />
          </IconButton>
          <div>
            <ServerFunctionInstanceDetail id={props.id} value={props.instance} />
          </div>
        </div>
        <div>
          <IconButton onClick={props.onDelete}>
            <TrashIcon title="Delete instance" />
          </IconButton>
        </div>
      </div>
      <div data-start-function-instance-viewer-content>
        <TabGroup horizontal value={tab()} onChange={value => setTab(value ?? "request")}>
          <TabList>
            <Tab value="request">Request</Tab>
            <Tab value="response">Response</Tab>
          </TabList>
          <RequestViewer request={props.instance.request} />
          <ResponseViewer request={props.instance.request} response={props.instance.response} />
        </TabGroup>
      </div>
    </div>
  );
}

function EmptyServerFunctions(): JSX.Element {
  return (
    <Placeholder>
      <Text options={{ size: "xs" }}>No server function calls detected.</Text>
    </Placeholder>
  );
}

export interface ServerFunctionViewerProps {
  instances: Record<string, ServerFunctionInstance | undefined>;
  onDeleteInstance: (value: string) => void;
  show?: boolean;
}

export function ServerFunctionViewer(props: ServerFunctionViewerProps): JSX.Element {
  const [currentInstance, setCurrentInstance] = createSignal<string>();

  const keys = createMemo(() => Object.keys(props.instances));

  return (
    <Show when={props.show}>
      <div data-start-dev-toolbar-panel>
        <div data-start-functions-viewer>
          {/* request/response viewer */}
          <Show when={currentInstance()}>
            {value => (
              <Show when={props.instances[value()]}>
                {instance => (
                  <ServerFunctionInstanceViewer
                    id={value()}
                    instance={instance()}
                    onReturn={() => {
                      setCurrentInstance(undefined);
                    }}
                    onDelete={() => {
                      props.onDeleteInstance(value());
                    }}
                  />
                )}
              </Show>
            )}
          </Show>
          <Show when={!currentInstance()}>
            {/* list of calls */}
            <div data-start-functions-instances-container>
              <Show when={keys().length} fallback={<EmptyServerFunctions />}>
                <Select
                  data-start-functions-instances
                  horizontal={false}
                  value={currentInstance()}
                  onChange={current => setCurrentInstance(current)}
                >
                  <For each={keys()}>
                    {instance => (
                      <SelectOption value={instance}>
                        <Show when={props.instances[instance]}>
                          {current => (
                            <ServerFunctionInstanceDetail id={instance} value={current()} />
                          )}
                        </Show>
                      </SelectOption>
                    )}
                  </For>
                </Select>
              </Show>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}
