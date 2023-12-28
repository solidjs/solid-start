import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import { CodeView } from './CodeView';

export interface CompiledStackFrameProps {
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

export function CompiledStackFrame(
  props: CompiledStackFrameProps,
): JSX.Element {
  return (
    <div class="dev-overlay-stack-frame">
      <Show when={props.functionName}>
        <span>
          {'at '}
          <span>{props.functionName}</span>
        </span>
      </Show>
      <div>
        {props.fileName && (
          <span>
            {props.fileName}
            {props.lineNumber && `:${props.lineNumber}`}
            {props.columnNumber && `:${props.columnNumber}`}
          </span>
        )}
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
