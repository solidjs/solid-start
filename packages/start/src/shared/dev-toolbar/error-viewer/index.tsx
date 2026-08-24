// @refresh skip
import { parse as parseErrorStack, type StackFrameLite } from "error-stack-parser-es/lite";
import * as htmlToImage from "html-to-image";
import type { JSX } from "solid-js";
import { createMemo, createSignal, ErrorBoundary, For, Show, Suspense } from "solid-js";
import IconButton from "../../ui/IconButton.tsx";
import { Select, SelectOption } from "../../ui/Select.tsx";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CameraIcon,
  DiscordIcon,
  GithubIcon,
  RefreshIcon,
  ViewCompiledIcon,
  ViewOriginalIcon,
} from "../icons.tsx";
import { CodeView } from "./CodeView.tsx";
import { createStackFrame, type StackFrameSource } from "./create-stack-frame.ts";
import download from "./download.ts";
import "./styles.css";

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

interface ErrorInfoProps {
  error: unknown;
}

function ErrorInfo(props: ErrorInfoProps): JSX.Element {
  const error = createMemo(() => {
    const e = props.error;

    if (e instanceof Error) {
      return { name: e.name, message: e.message };
    }

    if (e instanceof ErrorEvent) {
      return { message: e.message };
    }

    return { message: (e as Error).toString() };
  });

  return (
    <span data-start-error-viewer-error-info>
      <span data-start-error-viewer-error-info-name>{error().name}</span>
      <span data-start-error-viewer-error-info-message>{error().message}</span>
    </span>
  );
}

interface StackFramesContentProps {
  error: Error;
  isCompiled: boolean;
}

function getFileName(source: string): string {
  try {
    const path = source.startsWith("/") ? new URL(source, "file://") : new URL(source);
    const paths = path.pathname.split("/");
    return paths[paths.length - 1]!;
  } catch (error) {
    return getFileName(`/${source}`);
  }
}

function getFilePath(source: StackFrameSource) {
  const line = source.line ? `:${source.line}` : "";
  const column = source.column ? `:${source.column}` : "";
  return `${getFileName(source.source)}${line}${column}`;
}

function CodeFallback(): JSX.Element {
  return (
    <div data-start-error-viewer-stack-frames-code-fallback>
      <span>Source not available.</span>
    </div>
  );
}

interface RawStackFrameOptionProps {
  frame: StackFrameLite;
  disabled?: boolean;
}

// Frame rendered from the raw (unmapped) stack info — used while the source
// is loading or when it is unreachable, so the frame never vanishes from
// the list.
function RawStackFrameOption(props: RawStackFrameOptionProps): JSX.Element {
  const fileName = props.frame.file;
  return (
    <SelectOption
      value={props.frame}
      disabled={props.disabled}
      data-start-error-viewer-stack-frame
    >
      <span data-start-error-viewer-stack-frame-function>
        {props.frame.function ?? "<anonymous>"}
      </span>
      <span data-start-error-viewer-stack-frame-file>
        {fileName
          ? getFilePath({
              source: fileName,
              content: "",
              line: props.frame.line!,
              column: props.frame.col!,
              name: props.frame.function,
            })
          : "<unknown source>"}
      </span>
    </SelectOption>
  );
}

function StackFramesContent(props: StackFramesContentProps) {
  const stackframes = parseErrorStack(props.error, { allowEmpty: true });

  const [selectedFrame, setSelectedFrame] = createSignal(stackframes[0]!);

  return (
    <div data-start-error-viewer-stack-frames-content>
      <Select<StackFrameLite>
        data-start-error-viewer-stack-frames
        value={selectedFrame()}
        onChange={setSelectedFrame}
      >
        <For each={stackframes}>
          {current => (
            <ErrorBoundary fallback={<RawStackFrameOption frame={current} disabled />}>
              {(() => {
                const data = createStackFrame(current, () => props.isCompiled);
                return (
                  <Suspense fallback={<RawStackFrameOption frame={current} />}>
                    <Show when={data()} keyed fallback={<RawStackFrameOption frame={current} />}>
                      {source => (
                        <SelectOption data-start-error-viewer-stack-frame value={current}>
                          <span data-start-error-viewer-stack-frame-function>
                            {source.name ?? "<anonymous>"}
                          </span>
                          <span data-start-error-viewer-stack-frame-file>
                            {getFilePath(source)}
                          </span>
                        </SelectOption>
                      )}
                    </Show>
                  </Suspense>
                );
              })()}
            </ErrorBoundary>
          )}
        </For>
      </Select>
      <div data-start-error-viewer-stack-frames-code>
        <Show when={selectedFrame()} keyed>
          {frame => (
            // Keyed on the frame so a failure inspecting one frame (an
            // unreachable source, a failed highlight) resets when another
            // frame is selected instead of leaving the pane stuck.
            <ErrorBoundary fallback={<CodeFallback />}>
              {(() => {
                const data = createStackFrame(frame, () => props.isCompiled);
                return (
                  <Suspense fallback={<CodeFallback />}>
                    <Show when={data()} keyed fallback={<CodeFallback />}>
                      {source => (
                        <>
                          <span data-start-error-viewer-stack-frames-code-source>
                            {source.source}
                          </span>
                          <div data-start-error-viewer-stack-frames-code-container>
                            <CodeView
                              fileName={source.source}
                              line={source.line}
                              content={source.content}
                            />
                          </div>
                        </>
                      )}
                    </Show>
                  </Suspense>
                );
              })()}
            </ErrorBoundary>
          )}
        </Show>
      </div>
    </div>
  );
}

interface StackFramesProps {
  error: unknown;
  isCompiled: boolean;
}

function StackFrames(props: StackFramesProps) {
  return (
    <Show when={props.error instanceof Error && props.error} keyed>
      {current => <StackFramesContent error={current} isCompiled={props.isCompiled} />}
    </Show>
  );
}

interface ErrorViewerProps {
  show?: boolean;
  errors: any[];
  resetError: () => void;
}

const ISSUE_THREAD = "https://github.com/solidjs/solid-start/issues/new";
const DISCORD_INVITE = "https://discord.com/invite/solidjs";

export default function ErrorViewer(props: ErrorViewerProps): JSX.Element {
  const [currentPage, setCurrentPage] = createSignal(1);
  const [isCompiled, setIsCompiled] = createSignal(false);
  const length = createMemo(() => props.errors.length);

  const truncated = createMemo(() => {
    return Math.min(currentPage(), length());
  });

  function goPrev() {
    setCurrentPage(c => {
      if (c > 1) {
        return c - 1;
      }
      return length();
    });
  }

  function goNext() {
    setCurrentPage(c => {
      if (c < length()) {
        return c + 1;
      }
      return 1;
    });
  }

  function toggleIsCompiled() {
    setIsCompiled(c => !c);
  }

  const [panel, setPanel] = createSignal<HTMLElement>();

  function downloadScreenshot() {
    const current = panel();
    if (current) {
      htmlToImage
        .toPng(current, {
          style: {
            transform: "scale(0.75)",
          },
        })
        .then(url => {
          download(url, "start-screenshot.png");
        });
    }
  }

  function redirectToGithub() {
    const url = new URL(ISSUE_THREAD);
    url.searchParams.append("labels", "bug");
    url.searchParams.append("labels", "needs+triage");
    url.searchParams.append("template", "bug.yml");
    url.searchParams.append("title", `[Bug?]:` + props.errors[truncated() - 1].toString());
    window.open(url, "_blank")!.focus();
  }

  function redirectToDiscord() {
    window.open(DISCORD_INVITE, "_blank")!.focus();
  }

  return (
    <Show when={props.show}>
      <div data-start-dev-toolbar-panel>
        <div ref={setPanel} data-start-error-viewer>
          <div data-start-error-viewer-navbar>
            <div data-start-error-viewer-navbar-left>
              <Show when={props.errors.length > 1}>
                <div data-start-error-viewer-pagination>
                  <IconButton data-start-error-viewer-button onClick={goPrev} type="button">
                    <ArrowLeftIcon title="Go Previous" />
                  </IconButton>
                  <div data-start-error-viewer-page-counter>
                    {`${truncated()} of ${props.errors.length}`}
                  </div>
                  <IconButton data-start-error-viewer-button onClick={goNext} type="button">
                    <ArrowRightIcon title="Go Next" />
                  </IconButton>
                </div>
              </Show>
            </div>
            <div data-start-error-viewer-controls>
              <IconButton data-start-error-viewer-button onClick={redirectToGithub} type="button">
                <GithubIcon title="Create an issue thread on Github" />
              </IconButton>
              <IconButton data-start-error-viewer-button onClick={redirectToDiscord} type="button">
                <DiscordIcon title="Join our Discord Channel" />
              </IconButton>
              <IconButton data-start-error-viewer-button onClick={downloadScreenshot} type="button">
                <CameraIcon title="Capture Error Overlay" />
              </IconButton>
              <IconButton data-start-error-viewer-button onClick={toggleIsCompiled} type="button">
                <Show
                  when={isCompiled()}
                  fallback={<ViewOriginalIcon title="View Original Source" />}
                >
                  <ViewCompiledIcon title="View Compiled Source" />
                </Show>
              </IconButton>
              <IconButton data-start-error-viewer-button onClick={props.resetError} type="button">
                <RefreshIcon title="Reset Error" />
              </IconButton>
            </div>
          </div>
          <Show when={props.errors[truncated() - 1]} keyed>
            {current => (
              <div data-start-error-viewer-content>
                <ErrorInfo error={current} />
                <StackFrames error={current} isCompiled={isCompiled()} />
              </div>
            )}
          </Show>
        </div>
      </div>
    </Show>
  );
}
