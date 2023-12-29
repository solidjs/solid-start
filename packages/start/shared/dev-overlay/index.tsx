import ErrorStackParser from 'error-stack-parser';
import type { JSX } from 'solid-js';
import { ErrorBoundary, For, Show, Suspense, createEffect, createMemo, createSignal, onCleanup, resetErrorBoundaries } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Dialog, DialogOverlay, DialogPanel, Select, SelectOption } from 'terracotta';
import { ClientOnly } from './ClientOnly';
import { CodeView } from './CodeView';
import { StackFrameSource, createStackFrame } from './createStackFrame';
import { ArrowLeftIcon, ArrowRightIcon, RefreshIcon, ViewCompiledIcon, ViewOriginalIcon } from './icons';
import './styles.css';

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface ErrorInfoProps {
  error: unknown;
}

function ErrorInfo(props: ErrorInfoProps): JSX.Element {
  return (
    <Show when={props.error instanceof Error && props.error} keyed fallback={<span>{props.error.toString()}</span>}>
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

function getFilePath(source: StackFrameSource) {
  const line = source.line ? `:${source.line}` : '';
  const column = source.column ? `:${source.column}` : '';
  return `${source.source}${line}${column}`;
}

function StackFramesContent(props: StackFramesContentProps) {
  const stackframes = ErrorStackParser.parse(props.error);

  const [selectedFrame, setSelectedFrame] = createSignal(stackframes[0]);

  createEffect(() => {
    console.log('selected', selectedFrame());
  });

  return (
    <div class="dev-overlay-stack-frames-content">
      <Select<ErrorStackParser.StackFrame>
        class="dev-overlay-stack-frames"
        value={selectedFrame()}
        onChange={setSelectedFrame}
      >
        <For each={stackframes}>
          {(current) => {
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
          }}
        </For>
      </Select>
      <div class="dev-overlay-stack-frames-code">
        <div class="dev-overlay-stack-frames-code-container">
          {(() => {
            const data = createStackFrame(selectedFrame(), () => props.isCompiled);
            return (
              <Suspense>
                <Show when={data()} keyed>
                  {(source) => (
                    <CodeView fileName={source.source} line={source.line} content={source.content} />
                  )}
                </Show>
              </Suspense>
            );
          })()}
        </div>
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

function DevOverlayDialog(props: DevOverlayDialogProps): JSX.Element {
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

  return (
    <ClientOnly>
      <Portal>
        <Dialog class="dev-overlay" isOpen>
          <div>
            <DialogOverlay class="dev-overlay-background"/>
            <DialogPanel class="dev-overlay-panel">
              <div class="dev-overlay-navbar">
                <div class="dev-overlay-pagination">
                  <button class="dev-overlay-button" onClick={goPrev} type="button">
                    <ArrowLeftIcon title="Go Previous" />
                  </button>
                  <button class="dev-overlay-button" onClick={goNext} type="button">
                    <ArrowRightIcon title="Go Next" />
                  </button>
                </div>
                <div class="dev-overlay-page-counter">
                  {`${truncated()} of ${props.errors.length}`}
                </div>
                <div class="dev-overlay-controls">
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
                  <Suspense>
                    <div class="dev-overlay-content">
                      <ErrorInfo error={current} />
                      <StackFrames error={current} isCompiled={isCompiled()} />
                    </div>
                  </Suspense>
                )}
              </Show>
            </DialogPanel>
          </div>
        </Dialog>
      </Portal>
    </ClientOnly>
  );
}

export interface DevOverlayProps {
  children?: JSX.Element;
}

export function DevOverlay(props: DevOverlayProps): JSX.Element {
  const [errors, setErrors] = createSignal<unknown[]>([]);

  function resetError() {
    setErrors([]);
    resetErrorBoundaries();
  }

  function pushError(error: unknown) {
    console.error(error);
    setErrors((current) => [error, ...current]);
  }

  createEffect(() => {
    const onErrorEvent = (error: ErrorEvent) => {
      pushError(error.error);
    };

    window.addEventListener('error', onErrorEvent);

    onCleanup(() => {
      window.removeEventListener('error', onErrorEvent);
    });
  });

  return (
    <>
      <ErrorBoundary fallback={error => {
        pushError(error);
        return null;
      }}>
        {props.children}
      </ErrorBoundary>
      <Show when={errors().length}>
        <DevOverlayDialog errors={errors()} resetError={resetError} />
      </Show>
    </>
  );
}
