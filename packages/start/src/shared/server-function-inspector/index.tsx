import {
  createEffect,
  createSignal,
  For,
  type JSX,
  onCleanup,
  Show,
} from "solid-js";
import { createStore } from "solid-js/store";
import { Portal } from "solid-js/web";
import { Badge } from "../ui/Badge.tsx";
import Button from "../ui/Button.tsx";
import { Dialog, DialogOverlay, DialogPanel } from "../ui/Dialog.tsx";
import { Select, SelectOption } from "../ui/Select.tsx";
import { Tab, TabGroup, TabList, TabPanel } from "../ui/Tabs.tsx";
import { HeadersViewer } from "./HeadersViewer.tsx";
import { SerovalViewer } from "./SerovalViewer.tsx";
import {
  captureServerFunctionCall,
  type ServerFunctionRequest,
  type ServerFunctionResponse,
} from "./server-function-tracker.ts";
import "./styles.css";
import { Section } from "../ui/Section.tsx";

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
          if (props.source.source.headers.has('x-serialized')) {
            return <SerovalViewer stream={props.source.source.clone()} />
          }
        })()}
      </Section>
    </>
  );
}

interface RequestViewerProps {
  request: ServerFunctionRequest;
}

function RequestViewer(props: RequestViewerProps): JSX.Element {
  return (
    <TabPanel class="server-function-instance-tab-panel" value="request">
      <ContentViewer source={props.request} />
    </TabPanel>
  );
}

interface ResponseViewerProps {
  response?: ServerFunctionResponse;
}

function ResponseViewer(props: ResponseViewerProps): JSX.Element {
  return (
    <TabPanel class="server-function-instance-tab-panel" value="response">
      <Show when={props.response}>
        {(instance) => (
          <ContentViewer source={instance()} />
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
      <ResponseViewer response={props.instance.response} />
    </TabGroup>
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

  return (
    <Portal>
      <Dialog isOpen={isOpen()} onChange={setIsOpen}>
        <div>
          <DialogOverlay />
          <DialogPanel>
            <div class="server-function-inspector">
              {/* list of calls */}
              <div class="server-function-instances-container">
                <Select
                  class="server-function-instances"
                  horizontal={false}
                  value={currentInstance()}
                  onChange={(current) => setCurrentInstance(current)}
                >
                  <For each={Object.keys(store.instances)}>
                    {(instance) => (
                      <SelectOption value={instance}>
                        <Show when={store.instances[instance]}>
                          {(current) => (
                            <>
                              <span class="server-function-instance-detail">
                                <Badge
                                  type="info"
                                  value={current().request.source.method}
                                />
                                {instance}
                              </span>
                              <Show when={current().response}>
                                {(response) => {
                                  if (response().source.ok) {
                                    return <Badge type="success" value={response().source.status} />;
                                  }
                                  return <Badge type="failure" value={response().source.status} />;
                                }}
                              </Show>
                            </>
                          )}
                        </Show>
                      </SelectOption>
                    )}
                  </For>
                </Select>
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
