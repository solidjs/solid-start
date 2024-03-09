// @refresh skip
import ErrorStackParser from 'error-stack-parser';
import * as htmlToImage from 'html-to-image';
import type { JSX } from 'solid-js';
import { ErrorBoundary, For, Show, Suspense, createMemo, createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Dialog, DialogOverlay, DialogPanel, Select, SelectOption } from 'terracotta';
import info from '../../../package.json';
import { CodeView } from './CodeView';
import { createStackFrame, type StackFrameSource } from './createStackFrame';
import download from './download';
import { ArrowLeftIcon, ArrowRightIcon, CameraIcon, DiscordIcon, GithubIcon, RefreshIcon, SolidStartIcon, ViewCompiledIcon, ViewOriginalIcon } from './icons';
import './styles.css';

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface ErrorInfoProps {
  error: unknown;
}

function ErrorInfo(props: ErrorInfoProps): JSX.Element {
  return (
    <Show when={props.error instanceof Error && props.error} keyed fallback={<span>{(props.error as Error).toString()}</span>}>
      {(current) => (
        <span class="dev-overlay-error-info">
          <span class="dev-overlay-error-info-name">{current.name}</span>
          <span class="dev-overlay-error-info-message">{current.message}</span>
        </span>
      )}
    </Show>
  );
}

interface StackFramesContentProps {
  error: Error;
  isCompiled: boolean;
}

function getFileName(source: string): string {
  try {
    const path = source.startsWith('/') ? new URL(source, 'file://') : new URL(source);
    const paths = path.pathname.split('/');
    return paths[paths.length - 1]!;
  } catch (error) {
    return getFileName(`/${source}`);
  }
}

function getFilePath(source: StackFrameSource) {
  const line = source.line ? `:${source.line}` : '';
  const column = source.column ? `:${source.column}` : '';
  return `${getFileName(source.source)}${line}${column}`;
}

function CodeFallback(): JSX.Element {
  return <div class="dev-overlay-stack-frames-code-fallback">
    <span>Source not available.</span>
  </div>;
}

function StackFramesContent(props: StackFramesContentProps) {
  const stackframes = ErrorStackParser.parse(props.error);

  const [selectedFrame, setSelectedFrame] = createSignal(stackframes[0]!);

  return (
      <div class="dev-overlay-stack-frames-content">
        <div class="dev-overlay-stack-frames-code">
            <ErrorBoundary fallback={null}>
              {(() => {
                const data = createStackFrame(selectedFrame(), () => props.isCompiled);
                return (
                  <Suspense fallback={<CodeFallback />}>
                    <Show when={data()} keyed fallback={<CodeFallback />}>
                      {(source) => (
                        <>
                          <span class="dev-overlay-stack-frames-code-source">{source.source}</span>
                          <div class="dev-overlay-stack-frames-code-container">
                            <CodeView fileName={source.source} line={source.line} content={source.content} />
                          </div>
                        </>
                      )}
                    </Show>
                  </Suspense>
                );
              })()}
            </ErrorBoundary>
        </div>
        <Select<ErrorStackParser.StackFrame>
          class="dev-overlay-stack-frames"
          value={selectedFrame()}
          onChange={setSelectedFrame}
        >
          <For each={stackframes}>
            {(current) => (
            <ErrorBoundary fallback={(
              <div class="dev-overlay-stack-frame">
                <span class="dev-overlay-stack-frame-function">{current.functionName ?? '<anonymous>'}</span>
                <span class="dev-overlay-stack-frame-file">{getFilePath({
                  source: current.getFileName()!,
                  content: '',
                  line: current.getLineNumber()!,
                  column: current.getColumnNumber()!,
                  name: current.getFunctionName(),
                })}</span>
              </div>
            )}>
              {(() => {
                const data = createStackFrame(current, () => props.isCompiled);
                return (
                  <Suspense>
                    <Show when={data()} keyed>
                      {(source) => (
                        <SelectOption class="dev-overlay-stack-frame" value={current}>
                          <span class="dev-overlay-stack-frame-function">{source.name ?? '<anonymous>'}</span>
                          <span class="dev-overlay-stack-frame-file">{getFilePath(source)}</span>
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
      {(current) => (
        <StackFramesContent error={current} isCompiled={props.isCompiled} />
      )}
    </Show>
  );
}

interface DevOverlayDialogProps {
  errors: any[];
  resetError: () => void;
}

const ISSUE_THREAD = 'https://github.com/solidjs/solid-start/issues/new';
const DISCORD_INVITE = 'https://discord.com/invite/solidjs';

export default function DevOverlayDialog(props: DevOverlayDialogProps): JSX.Element {
  const [currentPage, setCurrentPage] = createSignal(1);
  const [isCompiled, setIsCompiled] = createSignal(false);
  const length = createMemo(() => props.errors.length);

  const truncated = createMemo(() => {
    return Math.min(currentPage(), length());
  });

  function goPrev() {
    setCurrentPage((c) => {
      if (c > 1) {
        return c - 1;
      }
      return length();
    });
  }

  function goNext() {
    setCurrentPage((c) => {
      if (c < length()) {
        return c + 1;
      }
      return 1;
    });
  }

  function toggleIsCompiled() {
    setIsCompiled((c) => !c);
  }

  const [panel, setPanel] = createSignal<HTMLElement>();

  function downloadScreenshot() {
    const current = panel();
    if (current) {
      htmlToImage.toPng(current, {
        style: {
          transform: 'scale(0.75)',
        },
      }).then((url) => {
        download(url, 'start-screenshot.png');
      });
    }
  }

  function redirectToGithub() {
    const url = new URL(ISSUE_THREAD);
    url.searchParams.append('labels', 'bug');
    url.searchParams.append('labels', 'needs+triage');
    url.searchParams.append('template', 'bug.yml');
    url.searchParams.append('title', `[Bug?]:` + props.errors[truncated() - 1].toString());
    window.open(url, '_blank')!.focus();
  }

  function redirectToDiscord() {
    window.open(DISCORD_INVITE, '_blank')!.focus();
  }

  return (
    <Portal>
      <Dialog class="dev-overlay" isOpen>
        <div>
          <DialogOverlay class="dev-overlay-background"/>
          <DialogPanel ref={setPanel} class="dev-overlay-panel-container">
            <div class="dev-overlay-panel">
              <div class="dev-overlay-navbar">
                <div class="dev-overlay-navbar-left">
                  <div class="dev-overlay-version">
                    <div>
                      <SolidStartIcon title="Solid Start Version" />
                    </div>
                    <span>{info.version as string}</span>
                  </div>
                  <Show when={props.errors.length > 1}>
                    <div class="dev-overlay-pagination">
                      <button class="dev-overlay-button" onClick={goPrev} type="button">
                        <ArrowLeftIcon title="Go Previous" />
                      </button>
                      <div class="dev-overlay-page-counter">
                        {`${truncated()} of ${props.errors.length}`}
                      </div>
                      <button class="dev-overlay-button" onClick={goNext} type="button">
                        <ArrowRightIcon title="Go Next" />
                      </button>
                    </div>
                  </Show>
                </div>
                <div class="dev-overlay-controls">
                  <button class="dev-overlay-button" onClick={redirectToGithub} type="button">
                    <GithubIcon title="Create an issue thread on Github" />
                  </button>
                  <button class="dev-overlay-button" onClick={redirectToDiscord} type="button">
                    <DiscordIcon title="Join our Discord Channel" />
                  </button>
                  <button class="dev-overlay-button" onClick={downloadScreenshot} type="button">
                    <CameraIcon title="Capture Error Overlay" />
                  </button>
                  <button class="dev-overlay-button" onClick={toggleIsCompiled} type="button">
                    <Show when={isCompiled()} fallback={(
                      <ViewOriginalIcon title="View Original Source" />
                    )}>
                      <ViewCompiledIcon title="View Compiled Source" />
                    </Show>
                  </button>
                  <button class="dev-overlay-button" onClick={props.resetError} type="button">
                    <RefreshIcon title="Reset Error" />
                  </button>
                </div>
              </div>
              <Show when={props.errors[truncated() - 1]} keyed>
                {(current) => (
                  <div class="dev-overlay-content">
                    <ErrorInfo error={current} />
                    <StackFrames error={current} isCompiled={isCompiled()} />
                  </div>
                )}
              </Show>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </Portal>
  );
}