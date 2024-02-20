import { createMemo, createResource, type Accessor } from "solid-js";
import getSourceMap from "./get-source-map";

export interface StackFrameSource {
  content: string;
  source: string;
  name?: string;
  line: number;
  column: number;
}

function getActualFileSource(path: string): string {
  if (path.startsWith('file://')) {
    return '/_build/@fs' + path.substring('file://'.length);
  }
  return path;
}

export function createStackFrame(
  stackframe: StackFrame,
  isCompiled: () => boolean,
) {
  const [data] = createResource(
    () => ({
      fileName: stackframe.fileName,
      line: stackframe.lineNumber,
      column: stackframe.columnNumber,
      functionName: stackframe.functionName,
    }),
    async source => {
      if (!source.fileName) {
        return null;
      }
      const response = await fetch(getActualFileSource(source.fileName));
      if (!response.ok) {
        return null;
      }
      const content = await response.text();
      const sourceMap = await getSourceMap(source.fileName, content);
      return {
        source,
        content,
        sourceMap,
      };
    },
  );

  const info = createMemo(() => {
    const current = data();
    if (!current) {
      return undefined;
    }
    const { source, content, sourceMap } = current;

    if (!isCompiled() && source.line && source.column && sourceMap) {
      const result = sourceMap.originalPositionFor({
        line: source.line,
        column: source.column,
      });

      return {
        ...result,
        content: sourceMap.sourceContentFor(result.source),
      } as StackFrameSource;
    }

    return {
      source: source.fileName,
      line: source.line,
      column: source.column,
      name: source.functionName,
      content,
    } as StackFrameSource;
  });

  return info as Accessor<StackFrameSource>;
}
