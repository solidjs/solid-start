import {
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  onCleanup,
  Show,
} from "solid-js";
import { createStore } from "solid-js/store";
import { Portal } from "solid-js/web";
import { BODY_FORMAL_FILE, BODY_FORMAT_KEY, BodyFormat } from "../../server/server-functions-shared.ts";
import { Badge } from "../ui/Badge.tsx";
import Button from "../ui/Button.tsx";
import { Dialog, DialogOverlay, DialogPanel } from "../ui/Dialog.tsx";
import { Section } from "../ui/Section.tsx";
import { Select, SelectOption } from "../ui/Select.tsx";
import { Tab, TabGroup, TabList, TabPanel } from "../ui/Tabs.tsx";
import { BlobViewer } from "./BlobViewer.tsx";
import { FormDataViewer } from "./FormDataViewer.tsx";
import { HeadersViewer } from "./HeadersViewer.tsx";
import { HexViewer } from "./HexViewer.tsx";
import { SerovalViewer } from "./SerovalViewer.tsx";
import {
  captureServerFunctionCall,
  type ServerFunctionRequest,
  type ServerFunctionResponse,
} from "./server-function-tracker.ts";
import "./styles.css";
import { URLSearchParamsViewer } from "./URLSearchParamsViewer.tsx";
import { Text } from "../ui/Text.tsx";
import Placeholder from "../ui/Placeholder.tsx";
import { PropertySeparator, SerovalValue } from "./SerovalValue.tsx";

async function getFile(source: Response | Request): Promise<File> {
  const formData = await source.formData();
  const file = formData.get(BODY_FORMAL_FILE);
  if (!(file && file instanceof File)) {
    throw new Error('invalid file input');
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
          const contentType = source.headers.get('Content-Type');
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
    ['Cache', request.cache],
    ['Credentials', request.credentials],
    ['Destination', request.destination],
    ['Integrity', request.integrity],
    ['Keep Alive', request.keepalive],
    ['Mode', request.mode],
    ['Redirect', request.redirect],
    ['Referrer', request.referrer],
    ['Referrer Policy', request.referrerPolicy],
    ['URL', request.url],
  ];
}

function RequestViewer(props: RequestViewerProps): JSX.Element {
  return (
    <TabPanel value="request">
      <Section title="Information">
        <For each={convertRequestToEntries(props.request.source)}>
          {([key, value]) => (
            <div data-start-property>
              <Text options={{ size: 'xs', weight: 'semibold', wrap: 'nowrap' }}>{key}</Text>
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
    ['OK', response.ok],
    ['Redirected', response.redirected],
    ['Status', response.status],
    ['Status Text', response.statusText],
    ['Type', response.type],
    ['URL', response.url],
  ];
}

function ResponseViewer(props: ResponseViewerProps): JSX.Element {
  return (
    <TabPanel value="response">
      <Show when={props.response}>
        {(instance) => (
          <>
            <Section title="Information">
              <For each={convertResponseToEntries(instance().source)}>
                {([key, value]) => (
                  <div data-start-property>
                    <Text options={{ size: 'xs', weight: 'semibold', wrap: 'nowrap' }}>{key}</Text>
                    <PropertySeparator />
                    <SerovalValue value={value} />
                  </div>
                )}
              </For>
              <div data-start-property>
                <Text options={{ size: 'xs', weight: 'semibold', wrap: 'nowrap' }}>Timing</Text>
                <PropertySeparator />
                <SerovalValue value={`${((instance().time - props.request.time) / 1000).toFixed(2)}s`} />
              </div>
            </Section>
            <ContentViewer source={instance()} />
          </>
        )}
      </Show>
    </TabPanel>
  );
}

interface ServerFunctionInstance {
  request: ServerFunctionRequest;
  response?: ServerFunctionResponse;
}

interface ServerFunctionInstanceViewerProps {
  instance: ServerFunctionInstance;
  onDelete: () => void;
}

function ServerFunctionInstanceViewer(
  props: ServerFunctionInstanceViewerProps,
): JSX.Element {
  const [tab, setTab] = createSignal<"request" | "response">("request");
  return (
    <TabGroup
      class="server-function-instance-viewer"
      horizontal
      value={tab()}
      onChange={(value) => setTab(value ?? "request")}
    >
      <div class="server-function-instance-viewer-toolbar">
        <TabList>
          <Tab value="request">Request</Tab>
          <Tab value="response">Response</Tab>
        </TabList>
        <div class="server-function-instance-viewer-actions">
          <Button
            class="server-function-icon-button"
            type="button"
            onClick={props.onDelete}
          >
            Delete
          </Button>
        </div>
      </div>
      <RequestViewer request={props.instance.request} />
      <ResponseViewer request={props.instance.request} response={props.instance.response} />
    </TabGroup>
  );
}

function EmptyServerFunctions(): JSX.Element {
  return (
    <Placeholder>
      <Text options={{ size: 'xs' }}>
        No server function calls detected.
      </Text>
    </Placeholder>
  );
}

export function ServerFunctionInspector(): JSX.Element {
  const [currentInstance, setCurrentInstance] = createSignal<string>();

  const [store, setStore] = createStore({
    instances: {} as Record<string, ServerFunctionInstance | undefined>,
  });

  createEffect(() => {
    onCleanup(
      captureServerFunctionCall((call) => {
        if (call.type === "request") {
          setStore("instances", call.instance, {
            request: call,
          });
        } else {
          setStore("instances", call.instance, "response", call);
        }
      }),
    );
  });

  const [isOpen, setIsOpen] = createSignal(false);

  createEffect(() => {
    (window as any).__START__SERVER_FN__ = setIsOpen;
  });

  const keys = createMemo(() => Object.keys(store.instances));

  return (
    <Portal>
      <Dialog isOpen={isOpen()} onChange={setIsOpen}>
        <div>
          <DialogOverlay />
          <DialogPanel>
            <div class="server-function-inspector">
              {/* list of calls */}
              <div class="server-function-instances-container">
                <Show when={keys().length}  fallback={<EmptyServerFunctions />}>
                  <Select
                    class="server-function-instances"
                    horizontal={false}
                    value={currentInstance()}
                    onChange={(current) => setCurrentInstance(current)}
                  >
                    <For each={keys()}>
                      {(instance) => (
                        <SelectOption value={instance}>
                          <Show when={store.instances[instance]}>
                            {(current) => (
                              <>
                                <span class="server-function-instance-detail">
                                  <Badge
                                    type="info"
                                  >
                                    {current().request.source.method}
                                  </Badge>
                                  {instance}
                                </span>
                                <Show when={current().response}>
                                  {(response) => {
                                    if (response().source.ok) {
                                      return <Badge type="success">{response().source.status}</Badge>;
                                    }
                                    return <Badge type="failure">{response().source.status}</Badge>;
                                  }}
                                </Show>
                              </>
                            )}
                          </Show>
                        </SelectOption>
                      )}
                    </For>
                  </Select> 
                </Show>
              </div>
              {/* request/response viewer */}
              <Show when={currentInstance()}>
                {(value) => (
                  <Show when={store.instances[value()]}>
                    {(instance) => (
                      <ServerFunctionInstanceViewer
                        instance={instance()}
                        onDelete={() => {
                          setStore("instances", value(), undefined);
                        }}
                      />
                    )}
                  </Show>
                )}
              </Show>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </Portal>
  );
}
