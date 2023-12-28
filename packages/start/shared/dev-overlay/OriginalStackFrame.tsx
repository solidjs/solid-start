import { Show, createMemo, type JSX } from 'solid-js';
import { CodeView } from './CodeView';

export interface OriginalStackFrameProps {
  content: string;
  isConstructor?: boolean;
  isEval?: boolean;
  isNative?: boolean;
  isTopLevel?: boolean;
  columnNumber?: number;
  lineNumber?: number;
  fileName: string;
  functionName?: string;
}

export function OriginalStackFrame(
  props: OriginalStackFrameProps,
): JSX.Element {
  const filePath = createMemo(() => {
    const line = props.lineNumber ? `:${props.lineNumber}` : '';
    const column = props.columnNumber ? `:${props.columnNumber}` : '';
    return `${props.fileName}${line}${column}`;
  });
  return (
    <div class="dev-overlay-stack-frame">
      <Show when={props.functionName}>
        <span>
          {'at '}
          <span>{props.functionName}</span>
        </span>
      </Show>
      <div>
        <Show
          when={filePath().startsWith('.')}
          fallback={
            <a
              href={`vscode://file/${filePath()}`}
            >
              {filePath()}
            </a>
          }
        >
          <span>{filePath()}</span>
        </Show>
        <Show when={props.lineNumber} keyed={true}>
          {lineNumber => (
            <CodeView
              fileName={props.fileName}
              content={props.content}
              line={lineNumber}
            />
          )}
        </Show>
      </div>
    </div>
  );
}
