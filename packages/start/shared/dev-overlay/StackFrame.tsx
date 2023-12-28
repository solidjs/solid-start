import * as ErrorStackParser from 'error-stack-parser';
import { Show, createResource, type JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { CompiledStackFrame } from './CompiledStackFrame';
import { OriginalStackFrame } from './OriginalStackFrame';
import getSourceMap from './get-source-map';

type Unbox<T> = T extends Array<infer U> ? U : never;
type StackFrame = Unbox<ReturnType<typeof ErrorStackParser.parse>>;

interface StackFrameProps {
  instance: StackFrame;
  isCompiled: boolean;
}

export function StackFrame(props: StackFrameProps): JSX.Element {
  const [data] = createResource(
    () => ({
      isCompiled: props.isCompiled,
      fileName: props.instance.fileName,
      line: props.instance.lineNumber,
      column: props.instance.columnNumber,
      functionName: props.instance.functionName,
    }),
    async source => {
      if (!source.fileName) {
        return null;
      }
      const response = await fetch(source.fileName);
      const content = await response.text();
      const sourceMap = await getSourceMap(source.fileName, content);
      if (!source.isCompiled && sourceMap && source.line && source.column) {
        const result = sourceMap.originalPositionFor({
          line: source.line,
          column: source.column,
        });

        return {
          ...result,
          content: sourceMap.sourceContentFor(result.source),
        };
      }

      return {
        source: source.fileName,
        line: source.line,
        column: source.column,
        name: source.functionName,
        content,
      };
    },
  );

  return (
    <Show when={data()} keyed={true}>
      {result => (
        <Dynamic
          component={props.isCompiled ? CompiledStackFrame : OriginalStackFrame}
          isConstructor={props.instance.isConstructor}
          isEval={props.instance.isEval}
          isNative={props.instance.isNative}
          isTopLevel={props.instance.isToplevel}
          fileName={result.source}
          functionName={result.name ?? props.instance.functionName}
          columnNumber={result.column ?? props.instance.columnNumber}
          lineNumber={result.line ?? props.instance.lineNumber}
          content={result.content}
        />
      )}
    </Show>
  );
}
