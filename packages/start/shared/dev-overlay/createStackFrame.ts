import { Resource, createResource } from "solid-js";
import getSourceMap from "./get-source-map";

export interface StackFrameSource {
  content: string;
  source: string;
  name?: string;
  line: number;
  column: number;
}

export function createStackFrame(
  stackframe: StackFrame,
  isCompiled: () => boolean,
): Resource<StackFrameSource> {
  const [data] = createResource(
    () => ({
      isCompiled: isCompiled(),
      fileName: stackframe.fileName,
      line: stackframe.lineNumber,
      column: stackframe.columnNumber,
      functionName: stackframe.functionName,
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

  return data;
}
