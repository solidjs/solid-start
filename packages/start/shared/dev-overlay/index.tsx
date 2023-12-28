import ErrorStackParser from 'error-stack-parser';
import type { JSX } from 'solid-js';
import { ErrorBoundary, For, Show, Suspense, createEffect, createMemo, createSignal, onCleanup, resetErrorBoundaries } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Dialog, DialogOverlay, DialogPanel } from 'terracotta';
import { ClientOnly } from './ClientOnly';
import { StackFrame } from './StackFrame';
import { ArrowLeftIcon, ArrowRightIcon, RefreshIcon, ViewCompiledIcon, ViewOriginalIcon } from './icons';
import './styles.css';

interface ErrorInfoProps {
  error: unknown;
}

function ErrorInfo(props: ErrorInfoProps): JSX.Element {
  return (
    <Show when={props.error instanceof Error && props.error} keyed fallback={<span>{props.error.toString()}</span>}>
      {(current) => (
        <span class="dev-overlay-error-info">
          <span>{current.name}</span>
          {': '}
          <span>{current.message}</span>
        </span>
      )}
    </Show>
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
        <div class="dev-overlay-stack-frames">
          <For each={ErrorStackParser.parse(current)}>
            {(stackframe) => <StackFrame instance={stackframe} isCompiled={props.isCompiled} />}
          </For>
        </div>
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
